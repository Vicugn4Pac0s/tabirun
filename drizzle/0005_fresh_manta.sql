PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_template_t3app_user` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text(255),
	`email` text(255) NOT NULL,
	`email_verified` integer DEFAULT (unixepoch()),
	`image` text(255),
	`birth_date` text(10),
	`gender` text(50) DEFAULT 'unset' NOT NULL,
	`pace` text(255) DEFAULT 'unset' NOT NULL,
	`height` integer DEFAULT 0 NOT NULL,
	`weight` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_template_t3app_user`("id", "name", "email", "email_verified", "image", "birth_date", "gender", "pace", "height", "weight") SELECT "id", "name", "email", "email_verified", "image", "birth_date", "gender", "pace", "height", "weight" FROM `template_t3app_user`;--> statement-breakpoint
DROP TABLE `template_t3app_user`;--> statement-breakpoint
ALTER TABLE `__new_template_t3app_user` RENAME TO `template_t3app_user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;