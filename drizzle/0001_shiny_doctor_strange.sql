CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_runs_started` ON `runs` (`started_at`);--> statement-breakpoint
ALTER TABLE `leaderboard` ADD `run_id` text;--> statement-breakpoint
ALTER TABLE `leaderboard` ADD `verified` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_leaderboard_run` ON `leaderboard` (`run_id`);