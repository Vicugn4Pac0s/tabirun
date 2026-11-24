ALTER TABLE "tabirun_route" ADD COLUMN "status" varchar(20) DEFAULT 'completed' NOT NULL;--> statement-breakpoint
CREATE INDEX "route_created_by_status_idx" ON "tabirun_route" USING btree ("created_by","status");--> statement-breakpoint
ALTER TABLE "tabirun_route" ADD CONSTRAINT "route_status_valid" CHECK ("tabirun_route"."status" in ('draft', 'completed'));