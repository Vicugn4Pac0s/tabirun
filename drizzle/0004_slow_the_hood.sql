LOCK TABLE "tabirun_quota_usage" IN SHARE ROW EXCLUSIVE MODE;--> statement-breakpoint
UPDATE "tabirun_quota_usage" AS usage
SET "count" = duplicates.total_count
FROM (
  SELECT MIN("id") AS keep_id, SUM("count") AS total_count
  FROM "tabirun_quota_usage"
  GROUP BY "user_id", "feature", "date"
  HAVING COUNT(*) > 1
) AS duplicates
WHERE usage."id" = duplicates.keep_id;--> statement-breakpoint
DELETE FROM "tabirun_quota_usage" AS usage
USING "tabirun_quota_usage" AS keeper
WHERE usage."user_id" = keeper."user_id"
  AND usage."feature" = keeper."feature"
  AND usage."date" = keeper."date"
  AND usage."id" > keeper."id";--> statement-breakpoint
DROP INDEX "quota_user_feature_date_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "quota_user_feature_date_idx" ON "tabirun_quota_usage" USING btree ("user_id","feature","date");
