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
    '.sql': 'text/plain; charset=utf-8',
    '.ico': 'image/x-icon'
};

// 3. HTTP Server
const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // CORS Headers for API
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
            res.end(JSON.stringify({ error: err.message }));
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

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const playerName = (data.player_name || 'นายน้องกบ').trim().slice(0, 50);
                const maxHeight = Math.max(0, Math.min(65.0, parseFloat(data.max_height) || 0));
                const clearTime = Math.max(0, parseFloat(data.clear_time_seconds) || 0);
                const jumpCount = Math.max(0, parseInt(data.jump_count, 10) || 0);
                const isEscaped = data.is_escaped ? 1 : 0;
                const deviceType = (data.device_type || 'mobile').slice(0, 20);

                const stmt = db.prepare(`
                    INSERT INTO leaderboard (player_name, max_height, clear_time_seconds, jump_count, is_escaped, device_type)
                    VALUES (?, ?, ?, ?, ?, ?);
                `);
                stmt.run(playerName, maxHeight, clearTime, jumpCount, isEscaped, deviceType);

                // Fetch top 10
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
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // --- Static File Serving ---
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

    // Prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

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
