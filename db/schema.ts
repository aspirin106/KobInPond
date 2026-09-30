import { asc, desc, sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const leaderboard = sqliteTable("leaderboard", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playerName: text("player_name").notNull(),
    maxHeight: real("max_height").notNull(),
    clearTimeSeconds: real("clear_time_seconds").notNull(),
    jumpCount: integer("jump_count").notNull().default(0),
    isEscaped: integer("is_escaped").notNull().default(0),
    deviceType: text("device_type").notNull().default("mobile"),
    createdAt: text("created_at").notNull().default(sql.raw("(CURRENT_TIMESTAMP)")),
}, (table) => [
    index("idx_leaderboard_height_time").on(desc(table.maxHeight), asc(table.clearTimeSeconds)),
    index("idx_leaderboard_escaped_speed").on(desc(table.isEscaped), asc(table.clearTimeSeconds)),
]);
