PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_template_t3app_user` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text(255),
	`email` text(255) NOT NULL,
	`email_verified` integer DEFAULT (unixepoch()),
	`image` text(255),
	`birth_date` text(10),
	`gender` text(50),
	`pace` text(255),
	`height` integer,
	`weight` integer,
	`profile_completed_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_template_t3app_user`("id", "name", "email", "email_verified", "image", "birth_date", "gender", "pace", "height", "weight", "profile_completed_at")
SELECT
	"id",
	"name",
	"email",
	"email_verified",
	"image",
	NULLIF("birth_date", '0000-00-00'),
	NULLIF("gender", 'unset'),
	NULLIF("pace", 'unset'),
	NULLIF("height", 0),
	NULLIF("weight", 0),
	CASE
		WHEN "birth_date" IS NOT NULL
			AND "birth_date" != '0000-00-00'
			AND "gender" IS NOT NULL
			AND "gender" != 'unset'
			AND "pace" IS NOT NULL
			AND "pace" != 'unset'
			AND "height" IS NOT NULL
			AND "height" > 0
			AND "weight" IS NOT NULL
			AND "weight" > 0
		THEN unixepoch()
		ELSE NULL
	END
FROM `template_t3app_user`;--> statement-breakpoint
DROP TABLE `template_t3app_user`;--> statement-breakpoint
ALTER TABLE `__new_template_t3app_user` RENAME TO `template_t3app_user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;