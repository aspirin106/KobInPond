/**
 * กบในกะลา 3D (KOB in the Coconut Shell 3D) - WebApp & SQLite Server
 * รองรับทั้งการเสิร์ฟไฟล์ Static WebApp, PWA, และ REST API ฐานข้อมูลคะแนน
 * ใช้โมดูลมาตรฐานของ Node.js (Zero external dependencies)
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 8000;
const DB_FILE = path.join(__dirname, 'leaderboard.db');
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

// 1. Initialize SQLite Database
let db;
try {
    const isNewDb = !fs.existsSync(DB_FILE);
    db = new DatabaseSync(DB_FILE);

    if (isNewDb && fs.existsSync(SCHEMA_FILE)) {
        const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');
        db.exec(schemaSql);
        console.log('✅ สร้างฐานข้อมูล SQLite (leaderboard.db) จาก schema.sql สำเร็จ');
    } else {
        // Ensure table exists
        db.exec(`
            CREATE TABLE IF NOT EXISTS leaderboard (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_name VARCHAR(60) NOT NULL,
                max_height DECIMAL(5, 2) NOT NULL,
                clear_time_seconds DECIMAL(7, 2) NOT NULL,
                jump_count INTEGER NOT NULL DEFAULT 0,
                is_escaped BOOLEAN NOT NULL DEFAULT 0,
                device_type VARCHAR(20) DEFAULT 'mobile',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }
} catch (err) {
    console.error('⚠️ ไม่สามารถเริ่มระบบฐานข้อมูล SQLite ได้:', err);
}

// 2. MIME Types Mapping
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// --- In-Memory IP Rate Limiter ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_POST_PER_MINUTE = 5;          // Max 5 submissions per minute per IP
const rateLimitMap = new Map();

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now - entry.resetTime > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { count: 1, resetTime: now });
        return false;
    }
    if (entry.count >= MAX_POST_PER_MINUTE) {
        return true;
    }
    entry.count++;
    return false;
}

// Periodic cleanup of expired rate limit keys (every 5 mins)
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
        if (now - entry.resetTime > RATE_LIMIT_WINDOW_MS) {
            rateLimitMap.delete(ip);
        }
    }
}, 5 * 60 * 1000).unref();

// --- Score & Game Physics Sanity Validator ---
function validateScore(data) {
    const rawName = typeof data.player_name === 'string' ? data.player_name : 'นายน้องกบ';
    const playerName = rawName.trim().replace(/[\x00-\x1F\x7F]/g, '').slice(0, 30);
    if (!playerName) {
        return { valid: false, error: 'กรุณากรอกชื่อผู้เล่น (1-30 ตัวอักษร)' };
    }

    const maxHeight = parseFloat(data.max_height);
    const clearTime = parseFloat(data.clear_time_seconds);
    const jumpCount = parseInt(data.jump_count, 10);
    const isEscaped = data.is_escaped ? 1 : 0;
    const deviceType = (typeof data.device_type === 'string' ? data.device_type : 'mobile').slice(0, 20);

    if (isNaN(maxHeight) || maxHeight < 0 || maxHeight > 65.0) {
        return { valid: false, error: 'ระดับความสูงไม่ถูกต้อง (ต้องอยู่ระหว่าง 0.0 ถึง 65.0m)' };
    }
    if (isNaN(clearTime) || clearTime < 0 || clearTime > 86400) {
        return { valid: false, error: 'เวลาที่ใช้ไม่ถูกต้อง' };
    }
    if (isNaN(jumpCount) || jumpCount < 0 || jumpCount > 100000) {
        return { valid: false, error: 'จำนวนการกระโดดไม่ถูกต้อง' };
    }

    // 1. Without jumping, frog cannot climb above starting zone (2.0m)
    if (jumpCount === 0 && maxHeight > 2.0) {
        return { valid: false, error: 'สถิติผิดปกติ: ความสูงเกินจริงโดยไม่มีการกระโดด' };
    }

    // 2. Average height gained per jump cannot exceed physical max (~6.5m/jump)
    if (jumpCount > 0 && maxHeight > (jumpCount * 6.5 + 2.0)) {
        return { valid: false, error: 'สถิติผิดปกติ: อัตราความสูงต่อการกระโดดสูงเกินจริง' };
    }

    // 3. Victory escape check: must reach rim (>=55m), with reasonable jumps and time
    if (isEscaped === 1) {
        if (maxHeight < 55.0) {
            return { valid: false, error: 'สถิติผิดปกติ: บันทึกสถานะพ้นบ่อแต่ความสูงไม่ถึงปากบ่อ' };
        }
        if (jumpCount < 8) {
            return { valid: false, error: 'สถิติผิดปกติ: จำนวนครั้งที่กระโดดออกจากบ่อน้อยเกินจริง' };
        }
        if (clearTime < 5.0) {
            return { valid: false, error: 'สถิติผิดปกติ: เวลาที่ใช้พ้นบ่อเร็วกว่าความเป็นจริง (ต้องไม่ต่ำกว่า 5 วินาที)' };
        }
    }

    // 4. Vertical velocity speed limit: cannot average > 7.0 m/s
    if (maxHeight > 5.0 && clearTime > 0 && (maxHeight / clearTime) > 7.0) {
        return { valid: false, error: 'สถิติผิดปกติ: ความเร็วในการปีนบ่อสูงเกินขีดจำกัด' };
    }

    return {
        valid: true,
        data: {
            playerName,
            maxHeight: Math.round(maxHeight * 100) / 100,
            clearTime: Math.round(clearTime * 100) / 100,
            jumpCount,
            isEscaped,
            deviceType
        }
    };
}

// 3. HTTP Server
const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // Security & CORS Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // --- API: GET /api/leaderboard ---
    if (pathname === '/api/leaderboard' && req.method === 'GET') {
        if (!db) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database not initialized' }));
            return;
        }

        try {
            const query = db.prepare(`
                SELECT id, player_name, max_height, clear_time_seconds, jump_count, is_escaped, device_type, created_at
                FROM leaderboard
                ORDER BY max_height DESC, clear_time_seconds ASC
                LIMIT 25;
            `);
            const rows = query.all();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: rows }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'ไม่สามารถดึงข้อมูลตารางอันดับได้' }));
        }
        return;
    }

    // --- API: POST /api/leaderboard ---
    if (pathname === '/api/leaderboard' && req.method === 'POST') {
        if (!db) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database not initialized' }));
            return;
        }

        // Rate Limiting by IP
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
        if (checkRateLimit(clientIp)) {
            res.writeHead(429, {
                'Content-Type': 'application/json',
                'Retry-After': '60'
            });
            res.end(JSON.stringify({ error: 'คุณส่งคะแนนถี่เกินไป กรุณารอ 1 นาทีแล้วลองใหม่อีกครั้ง' }));
            return;
        }

        let body = '';
        let bodyLength = 0;
        const MAX_BODY_SIZE = 10 * 1024; // 10 KB limit
        let isTooLarge = false;

        req.on('data', chunk => {
            if (isTooLarge) return;
            bodyLength += chunk.length;
            if (bodyLength > MAX_BODY_SIZE) {
                isTooLarge = true;
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Payload too large (max 10KB)' }));
                req.destroy();
                return;
            }
            body += chunk;
        });

        req.on('end', () => {
            if (isTooLarge) return;
            try {
                const rawData = JSON.parse(body || '{}');
                const validation = validateScore(rawData);

                if (!validation.valid) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: validation.error }));
                    return;
                }

                const { playerName, maxHeight, clearTime, jumpCount, isEscaped, deviceType } = validation.data;

                const stmt = db.prepare(`
                    INSERT INTO leaderboard (player_name, max_height, clear_time_seconds, jump_count, is_escaped, device_type)
                    VALUES (?, ?, ?, ?, ?, ?);
                `);
                stmt.run(playerName, maxHeight, clearTime, jumpCount, isEscaped, deviceType);

                // Fetch top 25
                const rows = db.prepare(`
                    SELECT id, player_name, max_height, clear_time_seconds, jump_count, is_escaped, device_type, created_at
                    FROM leaderboard
                    ORDER BY max_height DESC, clear_time_seconds ASC
                    LIMIT 25;
                `).all();

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'บันทึกคะแนนสำเร็จ', data: rows }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }));
            }
        });
        return;
    }

    // --- Static File Serving ---
    // 1. Block dotfiles / hidden paths (.git, .env, .codegraph, etc.)
    const pathSegments = pathname.split('/');
    if (pathSegments.some(seg => seg.startsWith('.'))) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
    }

    const safeDir = path.resolve(__dirname);
    const targetRel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(safeDir, targetRel);

    // 2. Prevent path traversal outside safeDir
    if (!filePath.startsWith(safeDir + path.sep) && filePath !== path.join(safeDir, 'index.html')) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
    }

    // 3. Block sensitive server files and unapproved extensions
    const filename = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const BLOCKED_FILES = new Set(['server.js', 'schema.sql', 'package.json']);

    if (BLOCKED_FILES.has(filename) || ext === '.db' || ext === '.sql' || !MIME_TYPES[ext]) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        const contentType = MIME_TYPES[ext];
        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🐸 กบในกะลา 3D WebApp & Server กำลังทำงาน!`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🗄️ Database: SQLite (leaderboard.db)`);
    console.log(`⚡ API: http://localhost:${PORT}/api/leaderboard`);
    console.log(`=================================================\n`);
});
