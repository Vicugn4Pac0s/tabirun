-- ローカルまたは使い捨てのpg_cron対応DB専用。本番・Previewでは実行しない。
-- 0003とschedule-route-direction-cleanup.sqlの適用後、ジョブ登録者として実行する。
BEGIN;

CREATE TEMP TABLE route_direction_cleanup_cases
  (LIKE public.tabirun_route) ON COMMIT DROP;

INSERT INTO route_direction_cleanup_cases (
  id, title, points, created_by, created_at, updated_at,
  encoded_polyline, distance_meters, duration, direction_source,
  direction_calculated_at, direction_points_hash
)
SELECT id, 'fixture', '[]', CASE WHEN id = 5 THEN 'other' ELSE 'owner' END,
  CURRENT_TIMESTAMP - INTERVAL '1000 hours',
  CURRENT_TIMESTAMP - INTERVAL '700 hours',
  CASE WHEN id = 4 THEN NULL ELSE 'cached-path' END,
  CASE WHEN id = 4 THEN NULL ELSE 1200 END,
  CASE WHEN id = 4 THEN NULL ELSE '600s' END,
  CASE WHEN id = 4 THEN NULL WHEN id = 5 THEN 'straight_line' ELSE 'routes_api' END,
  CASE id
    WHEN 1 THEN CURRENT_TIMESTAMP - INTERVAL '696 hours 1 microsecond'
    WHEN 2 THEN CURRENT_TIMESTAMP - INTERVAL '696 hours'
    WHEN 3 THEN CURRENT_TIMESTAMP - INTERVAL '696 hours' + INTERVAL '1 microsecond'
    WHEN 4 THEN NULL
    WHEN 5 THEN CURRENT_TIMESTAMP - INTERVAL '720 hours'
    WHEN 6 THEN CURRENT_TIMESTAMP
  END,
  CASE WHEN id = 4 THEN NULL ELSE repeat('a', 64) END
FROM generate_series(1, 6) AS fixture(id);

CREATE TEMP TABLE route_direction_cleanup_before ON COMMIT DROP
AS TABLE route_direction_cleanup_cases;

DO $test$
DECLARE
  cleanup_command text;
BEGIN
  SELECT btrim(command) INTO STRICT cleanup_command
  FROM cron.job
  WHERE jobname = 'tabirun-route-direction-cleanup'
    AND username = CURRENT_USER;

  -- 登録済みのSQLを使い、更新先だけをテスト用の一時テーブルへ差し替える。
  IF cleanup_command NOT LIKE 'UPDATE public.tabirun_route%' THEN
    RAISE EXCEPTION 'Unexpected cleanup command. Review the registered job.';
  END IF;
  EXECUTE replace(cleanup_command, 'public.tabirun_route',
    'pg_temp.route_direction_cleanup_cases');

  IF (SELECT count(*) FROM route_direction_cleanup_cases) <> 6 THEN
    RAISE EXCEPTION 'Route rows must be preserved';
  END IF;

  IF EXISTS (
    SELECT 1 FROM route_direction_cleanup_cases
    WHERE id IN (1, 2, 5) AND (
      encoded_polyline IS NOT NULL OR distance_meters IS NOT NULL
      OR duration IS NOT NULL OR direction_source IS NOT NULL
      OR direction_calculated_at IS NOT NULL OR direction_points_hash IS NOT NULL
    )
  ) THEN
    RAISE EXCEPTION 'Expired directions must be cleared, including the boundary';
  END IF;

  IF EXISTS (
    SELECT * FROM route_direction_cleanup_cases WHERE id IN (3, 4, 6)
    EXCEPT
    SELECT * FROM route_direction_cleanup_before WHERE id IN (3, 4, 6)
  ) THEN
    RAISE EXCEPTION 'Fresh directions and legacy rows must be unchanged';
  END IF;

  IF EXISTS (
    SELECT id, title, points, created_by, created_at, updated_at
    FROM route_direction_cleanup_cases
    EXCEPT
    SELECT id, title, points, created_by, created_at, updated_at
    FROM route_direction_cleanup_before
  ) THEN
    RAISE EXCEPTION 'Route data and timestamps must be unchanged';
  END IF;

  RAISE NOTICE 'Route direction cleanup checks passed';
END;
$test$;

ROLLBACK;
