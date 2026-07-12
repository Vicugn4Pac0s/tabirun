CREATE TABLE "tabirun_account" (
	"user_id" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "tabirun_account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "tabirun_pace" (
	"id" serial PRIMARY KEY NOT NULL,
	"value" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tabirun_quota_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"feature" varchar(255) NOT NULL,
	"date" varchar(10) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tabirun_route" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(256),
	"points" text NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tabirun_session" (
	"session_token" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tabirun_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp DEFAULT now(),
	"image" varchar(255),
	"birth_date" varchar(10),
	"gender" varchar(50),
	"pace" varchar(255),
	"height" integer,
	"weight" integer,
	"home_lat" double precision,
	"home_lng" double precision,
	"profile_completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tabirun_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "tabirun_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "tabirun_account" ADD CONSTRAINT "tabirun_account_user_id_tabirun_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tabirun_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tabirun_quota_usage" ADD CONSTRAINT "tabirun_quota_usage_user_id_tabirun_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tabirun_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tabirun_route" ADD CONSTRAINT "tabirun_route_created_by_tabirun_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."tabirun_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tabirun_session" ADD CONSTRAINT "tabirun_session_userId_tabirun_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."tabirun_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "tabirun_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quota_user_feature_date_idx" ON "tabirun_quota_usage" USING btree ("user_id","feature","date");--> statement-breakpoint
CREATE INDEX "created_by_idx" ON "tabirun_route" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "title_idx" ON "tabirun_route" USING btree ("title");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "tabirun_session" USING btree ("userId");