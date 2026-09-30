// Used by both the Sites Worker and the local Node server.
(function () {
    const MAX_BODY = 256 * 1024, RUN_LIFETIME = 30 * 60 * 1000;
    const LIST = "SELECT id, player_name, max_height, clear_time_seconds, jump_count, is_escaped, device_type, created_at FROM leaderboard WHERE verified = 1 ORDER BY max_height DESC, clear_time_seconds ASC LIMIT 200";
    const limits = new Map();
    function json(value, status = 200, extra = {}) {
        return new Response(JSON.stringify(value), { status, headers: {
            "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff", ...extra } });
    }
    function limited(key) {
        const now = Date.now(), entry = limits.get(key);
        if (entry && now - entry.time < 60000) {
            if (++entry.count > 5) return true;
        } else limits.set(key, { time: now, count: 1 });
        // ponytail: bounded per-process quota; use a global service if stronger bot quotas are needed.
        if (limits.size > 5000) {
            for (const [ip, value] of limits) {
                if (now - value.time >= 60000 || limits.size > 5000) limits.delete(ip);
            }
        }
        return false;
    }
    async function readJson(request) {
        if (Number(request.headers.get("content-length")) > MAX_BODY) throw Error("too-large");
        const reader = request.body?.getReader();
        if (!reader) throw Error("invalid-json");
        const chunks = []; let size = 0;
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                size += value.byteLength;
                if (size > MAX_BODY) { await reader.cancel(); throw Error("too-large"); }
                chunks.push(value);
            }
        } finally { reader.releaseLock(); }
        const bytes = new Uint8Array(size); let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        return JSON.parse(new TextDecoder().decode(bytes));
    }
    async function handle(request, db, ip) {
        if (!db) return json({ error: "Leaderboard is unavailable" }, 503);
        const isRun = new URL(request.url).pathname === "/api/runs";
        if (!isRun && request.method === "GET") {
            return json({ success: true, data: (await db.prepare(LIST).all()).results });
        }
        if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, { Allow: isRun ? "POST" : "GET, POST" });
        if (limited((isRun ? "runs:" : "score:") + ip)) return json({ error: "กรุณารอสักครู่แล้วลองใหม่" }, 429, { "Retry-After": "60" });
        if (isRun) {
            const id = crypto.randomUUID(), now = Date.now();
            await db.prepare("DELETE FROM runs WHERE started_at < ?").bind(now - RUN_LIFETIME).run();
            await db.prepare("INSERT INTO runs (id, started_at) VALUES (?, ?)").bind(id, now).run();
            return json({ run_id: id, version: 1 }, 201);
        }
        if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
            return json({ error: "Expected application/json" }, 415);
        }
        let data;
        try { data = await readJson(request); }
        catch (error) { return json({ error: "Invalid payload" }, error.message === "too-large" ? 413 : 400); }
        if (!data || typeof data !== "object" || Array.isArray(data) ||
            typeof data.player_name !== "string" || !data.player_name.trim() ||
            data.player_name.length > 30 || /[\x00-\x1f\x7f]/.test(data.player_name) ||
            !["desktop", "mobile"].includes(data.device_type) ||
            typeof data.run_id !== "string" || !/^[0-9a-f-]{36}$/.test(data.run_id) ||
            ["max_height", "clear_time_seconds", "jump_count", "is_escaped"].some(key => key in data)) {
            return json({ error: "คะแนนต้องมาจากประวัติการเล่น กรุณาเริ่มรอบใหม่" }, 400);
        }
        const now = Date.now(), cutoff = now - RUN_LIFETIME;
        const run = await db.prepare("SELECT started_at FROM runs WHERE id = ?").bind(data.run_id).first();
        if (!run || run.started_at < cutoff || run.started_at > now) return json({ error: "รอบนี้หมดอายุ กรุณาเริ่มใหม่" }, 400);
        let score;
        try { score = globalThis.KobRules.replay(data.replay, (now - run.started_at) / 1000); }
        catch { return json({ error: "ตรวจสอบการเล่นไม่ผ่าน กรุณาเริ่มรอบใหม่" }, 400); }
        // A unique run_id and one INSERT SELECT prevent concurrent/repeated submissions.
        const result = await db.prepare(
            "INSERT INTO leaderboard (player_name, max_height, clear_time_seconds, jump_count, is_escaped, device_type, run_id, verified) SELECT ?, ?, ?, ?, ?, ?, id, 1 FROM runs WHERE id = ? AND started_at >= ? AND NOT EXISTS (SELECT 1 FROM leaderboard WHERE run_id = ?)"
        ).bind(data.player_name.trim(), score.maxHeight, score.clearTime, score.jumpCount, score.isEscaped,
            data.device_type, data.run_id, cutoff, data.run_id).run();
        if (result.meta.changes !== 1) return json({ error: "รอบนี้บันทึกคะแนนแล้ว กรุณาเริ่มใหม่" }, 409);
        return json({ success: true, score, data: (await db.prepare(LIST).all()).results }, 201);
    }
    globalThis.KobLeaderboard = { handle };
    if (typeof module !== "undefined") module.exports = globalThis.KobLeaderboard;
})();
