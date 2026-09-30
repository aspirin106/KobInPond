-- ============================================================
-- กบในกะลา 3D (KOB in the Coconut Shell 3D)
-- ฐานข้อมูลตารางคะแนนความสูงและเวลา (Leaderboard SQL Schema)
-- รองรับ: SQLite, MySQL, MariaDB, PostgreSQL
-- ============================================================

-- 1. สร้างตารางคะแนน (Leaderboard Table)
CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name VARCHAR(60) NOT NULL,              -- ชื่อผู้เล่น หรือชื่อน้องกบ
    max_height DECIMAL(5, 2) NOT NULL,             -- ความสูงสูงสุดที่ทำได้ (เมตร เช่น 65.00 m)
    clear_time_seconds DECIMAL(7, 2) NOT NULL,     -- เวลาที่ใช้ทั้งหมด (วินาที เช่น 84.50 s)
    jump_count INTEGER NOT NULL DEFAULT 0,         -- จำนวนครั้งที่ชาร์จกระโดด
    is_escaped BOOLEAN NOT NULL DEFAULT 0,         -- หลุดพ้นปากบ่อสำเร็จหรือไม่ (1 = สำเร็จ, 0 = ยังตกในบ่อ)
    device_type VARCHAR(20) DEFAULT 'mobile',      -- อุปกรณ์ที่ใช้เล่น ('mobile' หรือ 'desktop')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- วันและเวลาที่บันทึกผล
);

-- 2. ดัชนีเพิ่มความเร็วในการค้นหาและจัดอันดับ (Indexes for Fast Querying)
CREATE INDEX IF NOT EXISTS idx_leaderboard_height_time 
    ON leaderboard (max_height DESC, clear_time_seconds ASC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_escaped_speed 
    ON leaderboard (is_escaped DESC, clear_time_seconds ASC);

-- Start with an empty leaderboard; scores are submitted by players.

-- 4. คำสั่ง SQL ที่ใช้บ่อยในเกม (Useful Game Queries)

-- 4.1 จัดอันดับตามความสูงสูงสุด (Top 10 Highest Altitude)
-- SELECT 
--     RANK() OVER (ORDER BY max_height DESC, clear_time_seconds ASC) AS rank,
--     player_name,
--     max_height,
--     clear_time_seconds,
--     jump_count,
--     is_escaped,
--     created_at
-- FROM leaderboard
-- ORDER BY max_height DESC, clear_time_seconds ASC
-- LIMIT 10;

-- 4.2 จัดอันดับความเร็วผู้ที่หลุดพ้นปากบ่อได้สำเร็จ (Top 10 Escaped Speedrun)
-- SELECT 
--     RANK() OVER (ORDER BY clear_time_seconds ASC, jump_count ASC) AS rank,
--     player_name,
--     clear_time_seconds,
--     jump_count,
--     created_at
-- FROM leaderboard
-- WHERE is_escaped = 1
-- ORDER BY clear_time_seconds ASC, jump_count ASC
-- LIMIT 10;

-- 4.3 บันทึกคะแนนรอบการเล่นใหม่ (Insert New Score)
-- INSERT INTO leaderboard (player_name, max_height, clear_time_seconds, jump_count, is_escaped, device_type)
-- VALUES (?, ?, ?, ?, ?, ?);
