ALTER TABLE "tabirun_route" ADD COLUMN "encoded_polyline" text;--> statement-breakpoint
ALTER TABLE "tabirun_route" ADD COLUMN "distance_meters" integer;--> statement-breakpoint
ALTER TABLE "tabirun_route" ADD COLUMN "duration" text;--> statement-breakpoint
ALTER TABLE "tabirun_route" ADD COLUMN "direction_source" varchar(20);--> statement-breakpoint
ALTER TABLE "tabirun_route" ADD COLUMN "direction_calculated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tabirun_route" ADD COLUMN "direction_points_hash" varchar(64);--> statement-breakpoint
CREATE INDEX "route_direction_calculated_at_idx" ON "tabirun_route" USING btree ("direction_calculated_at");