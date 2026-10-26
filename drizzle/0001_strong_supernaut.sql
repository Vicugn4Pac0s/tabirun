UPDATE "tabirun_route" SET "title" = '無題のルート' WHERE "title" IS NULL OR "title" !~ '[^[:space:]]';--> statement-breakpoint
ALTER TABLE "tabirun_route" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tabirun_route" ADD CONSTRAINT "route_title_not_blank" CHECK ("tabirun_route"."title" ~ '[^[:space:]]');
