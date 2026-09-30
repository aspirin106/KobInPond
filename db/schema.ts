import { asc, desc, sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const runs = sqliteTable("runs", {
    id: text("id").primaryKey(),
    startedAt: integer("started_at").notNull(),
}, (table) => [index("idx_runs_started").on(table.startedAt)]);

export const leaderboard = sqliteTable("leaderboard", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playerName: text("player_name").notNull(),
    maxHeight: real("max_height").notNull(),
    clearTimeSeconds: real("clear_time_seconds").notNull(),
    jumpCount: integer("jump_count").notNull().default(0),
    isEscaped: integer("is_escaped").notNull().default(0),
    deviceType: text("device_type").notNull().default("mobile"),
    createdAt: text("created_at").notNull().default(sql.raw("(CURRENT_TIMESTAMP)")),
    runId: text("run_id"),
    verified: integer("verified").notNull().default(0),
}, (table) => [
    uniqueIndex("idx_leaderboard_run").on(table.runId),
    index("idx_leaderboard_height_time").on(desc(table.maxHeight), asc(table.clearTimeSeconds)),
    index("idx_leaderboard_escaped_speed").on(desc(table.isEscaped), asc(table.clearTimeSeconds)),
]);
