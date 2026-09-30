/**
 * กบในกะลา 3D (KOB in the Coconut Shell 3D) - WebApp & SQLite Server
 * รองรับทั้งการเสิร์ฟไฟล์ Static WebApp, PWA, และ REST API ฐานข้อมูลคะแนน
 * ใช้โมดูลมาตรฐานของ Node.js (Zero external dependencies)
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const { Readable } = require("node:stream");
require("./rules.js");
const leaderboard = require("./leaderboard-api.js");

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

    // Local SQLite follows the same append-only migrations as Sites D1.
    const columns = db.prepare("PRAGMA table_info(leaderboard)").all();
    if (!columns.some(column => column.name === "run_id")) {
        for (const file of fs.readdirSync(path.join(__dirname, "drizzle")).filter(file => file.endsWith(".sql") && !file.startsWith("0000")).sort()) {
            db.exec(fs.readFileSync(path.join(__dirname, "drizzle", file), "utf8"));
        }
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

const d1 = {
    prepare(sql) {
        let values = [];
        const statement = db.prepare(sql);
        return {
            bind(...args) { values = args; return this; },
            async first() { return statement.get(...values) || null; },
            async all() { return { results: statement.all(...values) }; },
            async run() { return { meta: { changes: Number(statement.run(...values).changes) } }; }
        };
    }
};

// 3. HTTP Server
const server = http.createServer(async (req, res) => {
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

    if (pathname === "/api/leaderboard" || pathname === "/api/runs") {
        try {
            const request = new Request("http://localhost" + req.url, {
                method: req.method, headers: req.headers,
                ...(req.method === "GET" || req.method === "HEAD" ? {} : { body: Readable.toWeb(req), duplex: "half" })
            });
            const response = await leaderboard.handle(request, db ? d1 : null, req.socket.remoteAddress || "unknown");
            res.writeHead(response.status, Object.fromEntries(response.headers));
            Readable.fromWeb(response.body).pipe(res);
        } catch (error) {
            console.error(error);
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Leaderboard is temporarily unavailable" }));
        }
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
    const BLOCKED_FILES = new Set(['server.js', 'schema.sql', 'package.json', 'leaderboard-api.js']);

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
    const actualPort = server.address().port;
    console.log(`\n=================================================`);
    console.log(`🐸 กบในกะลา 3D WebApp & Server กำลังทำงาน!`);
    console.log(`🌐 URL: http://localhost:${actualPort}`);
    console.log(`🗄️ Database: SQLite (leaderboard.db)`);
    console.log(`⚡ API: http://localhost:${PORT}/api/leaderboard`);
    console.log(`=================================================\n`);
});
