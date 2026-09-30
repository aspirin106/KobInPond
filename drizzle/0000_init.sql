CREATE TABLE `leaderboard` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_name` text NOT NULL,
	`max_height` real NOT NULL,
	`clear_time_seconds` real NOT NULL,
	`jump_count` integer DEFAULT 0 NOT NULL,
	`is_escaped` integer DEFAULT 0 NOT NULL,
	`device_type` text DEFAULT 'mobile' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_leaderboard_height_time` ON `leaderboard` ("max_height" desc,"clear_time_seconds" asc);--> statement-breakpoint
CREATE INDEX `idx_leaderboard_escaped_speed` ON `leaderboard` ("is_escaped" desc,"clear_time_seconds" asc);