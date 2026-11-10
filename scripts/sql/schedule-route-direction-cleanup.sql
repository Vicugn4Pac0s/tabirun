-- 本番・Previewへの実行は、対象DBごとの明示承認後に行う。
-- pg_cronの有効化と0003の適用を先に済ませる。通常のmigrationには含めない。
BEGIN;

-- 列が不足した状態で、実行時に失敗するジョブだけが登録されるのを防ぐ。
DO $preflight$
BEGIN
  PERFORM encoded_polyline, distance_meters, duration, direction_source,
    direction_calculated_at, direction_points_hash
  FROM public.tabirun_route
  LIMIT 0;
END;
$preflight$;

SELECT cron.schedule(
  'tabirun-route-direction-cleanup',
  '0 * * * *',
  $cleanup$
    UPDATE public.tabirun_route
    SET encoded_polyline = NULL,
        distance_meters = NULL,
        duration = NULL,
        direction_source = NULL,
        direction_calculated_at = NULL,
        direction_points_hash = NULL
    -- DSTやDBのタイムゾーンに左右されない29 × 24時間で判定する。
    WHERE direction_calculated_at <= CURRENT_TIMESTAMP - INTERVAL '696 hours';
  $cleanup$
);

COMMIT;
