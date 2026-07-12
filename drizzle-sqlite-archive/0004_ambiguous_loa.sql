CREATE TABLE `template_t3app_quota_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text(255) NOT NULL,
	`feature` text(255) NOT NULL,
	`date` text(10) NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `template_t3app_user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quota_user_feature_date_idx` ON `template_t3app_quota_usage` (`user_id`,`feature`,`date`);