import assert from "node:assert/strict";
import { readFile, readdir, mkdtemp, copyFile, mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { DatabaseSync } from "node:sqlite";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";

const require = createRequire(import.meta.url);
const Rules = require("../rules.js");
require("../leaderboard-api.js");
const source = (await readFile(new URL("../worker/index.js", import.meta.url), "utf8"))
    .replace(/^import "\.\/(?:rules|leaderboard-api)\.js";\r?\n/gm, "");
const { default: worker } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const sqlite = new DatabaseSync(":memory:");
const migrations = (await readdir(new URL("../drizzle", import.meta.url))).filter(file => file.endsWith(".sql")).sort();
sqlite.exec(await readFile(new URL("../drizzle/" + migrations[0], import.meta.url), "utf8"));
sqlite.exec("INSERT INTO leaderboard (player_name, max_height, clear_time_seconds) VALUES ('legacy', 999, 1)");
for (const file of migrations.slice(1)) sqlite.exec(await readFile(new URL("../drizzle/" + file, import.meta.url), "utf8"));
const env = {
    DB: {
        prepare(sql) {
            const statement = sqlite.prepare(sql); let values = [];
            return {
                bind(...args) { values = args; return this; },
                async first() { return statement.get(...values) || null; },
                async all() { return { results: statement.all(...values) }; },
                async run() { return { meta: { changes: Number(statement.run(...values).changes) } }; }
            };
        }
    },
    ASSETS: { async fetch() { return new Response("game"); } }
};
const proof = { version: 1, initial_angle: .7, segments: [[40, 4], [140, 0]] };
const payload = { player_name: "กบทดสอบ", device_type: "desktop", replay: proof };
const expected = Rules.replay(proof, 4);
const runId = (age = 4) => {
    const id = crypto.randomUUID();
    sqlite.prepare("INSERT INTO runs VALUES (?, ?)").run(id, Date.now() - age * 1000);
    return id;
};
const post = (data, ip = crypto.randomUUID()) => new Request("https://game.example/api/leaderboard", {
    method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
    body: typeof data === "string" ? data : JSON.stringify(data)
});
const send = data => worker.fetch(post(data), env);
let response = await worker.fetch(new Request("https://game.example/api/runs", { method: "POST" }), env);
assert.equal(response.status, 201);
assert.ok(sqlite.prepare("SELECT * FROM runs WHERE id = ?").get((await response.json()).run_id));
response = await worker.fetch(new Request("https://game.example/api/leaderboard"), env);
assert.deepEqual((await response.json()).data, [], "Legacy unverified scores are preserved but hidden");
assert.equal(sqlite.prepare("SELECT count(*) AS count FROM leaderboard").get().count, 1);
const good = { ...payload, run_id: runId() };
response = await send(good);
assert.equal(response.status, 201);
assert.deepEqual((await response.json()).score, expected, "Scores are derived from button inputs");
const stored = sqlite.prepare("SELECT * FROM leaderboard WHERE run_id = ?").get(good.run_id);
assert.equal(stored.max_height, expected.maxHeight);
assert.equal(stored.is_escaped, 0);
assert.equal(stored.verified, 1);
assert.equal((await send(good)).status, 409, "A run cannot submit twice");
const racing = { ...payload, run_id: runId() };
assert.deepEqual((await Promise.all([send(racing), send(racing)])).map(result => result.status).sort(), [201, 409]);
assert.equal(sqlite.prepare("SELECT count(*) AS n FROM leaderboard WHERE run_id = ?").get(racing.run_id).n, 1);
const forged = { player_name: "forged", max_height: 58.2, clear_time_seconds: 85.4,
    jump_count: 12, is_escaped: 1, device_type: "desktop" };
assert.equal((await send(forged)).status, 400, "The old forgeable API contract is rejected");
for (const field of ["max_height", "clear_time_seconds", "jump_count", "is_escaped"]) {
    assert.equal((await send({ ...payload, run_id: runId(), [field]: 999 })).status, 400);
}
for (const invalid of [
    { ...proof, version: 2 }, { ...proof, initial_angle: "1" },
    { ...proof, segments: [[40, 8], [140, 0]] },
    { ...proof, segments: [[40.5, 4], [140, 0]] },
    { ...proof, segments: [[-1, 4]] }, { ...proof, segments: [[Rules.MAX_TICKS + 1, 4]] },
    { ...proof, segments: [[1, 0], [40, 4], [140, 0]] },
    { ...proof, segments: Array.from({ length: Rules.MAX_SEGMENTS + 1 }, () => [1, 4]) }
]) assert.equal((await send({ ...payload, replay: invalid, run_id: runId() })).status, 400);
assert.equal((await send({ ...payload, run_id: runId(0) })).status, 400, "Faster-than-wall-clock replay is rejected");
assert.equal((await send({ ...payload, run_id: runId(1801) })).status, 400, "Expired sessions cannot write");
assert.equal((await send({ ...payload, run_id: crypto.randomUUID() })).status, 400, "Unknown sessions cannot write");
assert.equal((await send("x".repeat(256 * 1024 + 1))).status, 413);
assert.equal((await send("{")).status, 400);
for (let i = 0; i < 5; i++) {
    response = await worker.fetch(new Request("https://game.example/api/runs", {
        method: "POST", headers: { "CF-Connecting-IP": "rate-test", "X-Forwarded-For": String(i) }
    }), env);
    assert.equal(response.status, 201);
}
response = await worker.fetch(new Request("https://game.example/api/runs", {
    method: "POST", headers: { "CF-Connecting-IP": "rate-test", "X-Forwarded-For": "spoof" }
}), env);
assert.equal(response.status, 429);
response = await worker.fetch(new Request("https://game.example/"), env);
assert.equal(await response.text(), "game");
assert.equal(response.headers.get("x-frame-options"), "DENY");
const state = Rules.createState(proof.initial_angle);
for (const [ticks, buttons] of proof.segments) for (let i = 0; i < ticks; i++) Rules.step(state, buttons);
assert.equal(Math.round(state.maxHeight * 100) / 100, expected.maxHeight);
assert.equal(state.elapsedTicks, 180);

// Build a complete climb using only legal 60 Hz turn/charge/release inputs.
let climb = Rules.createState(), initialAngle = 0;
let deathStart, deathPrefix;
const segments = [];
function record(ticks, buttons) {
    if (!ticks) return;
    const last = segments.at(-1);
    if (last && last[1] === buttons) last[0] += ticks;
    else segments.push([ticks, buttons]);
    for (let i = 0; i < ticks; i++) Rules.step(climb, buttons);
}
for (let index = 1; index < Rules.platforms.length; index++) {
    const target = Rules.platforms[index];
    const desired = Math.atan2(target.pos.x - climb.pos.x, target.pos.z - climb.pos.z);
    if (index === 1) { initialAngle = desired; climb.facingAngle = desired; }
    let delta = (desired - climb.facingAngle) % (Math.PI * 2);
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    const turn = Math.round(delta / (3.4 * Rules.DT));
    let chosen;
    for (let offset = 0; offset <= 12 && !chosen; offset++) {
        for (const sign of offset ? [1, -1] : [1]) {
            const n = turn + offset * sign;
            for (let charge = 1; charge <= 49; charge++) {
                const trial = structuredClone(climb);
                for (let i = 0; i < Math.abs(n); i++) Rules.step(trial, n > 0 ? 1 : 2);
                for (let i = 0; i < charge; i++) Rules.step(trial, 4);
                Rules.step(trial, 0);
                let air = 1;
                while (!trial.onGround && air < 240) { Rules.step(trial, 0); air++; }
                if (Math.abs(trial.pos.y - (target.pos.y + target.height / 2)) < 1e-6 &&
                    Rules.contains(target, trial.pos) && (!target.isTopExit || trial.reachedWellTop)) {
                    chosen = { n, charge, air }; break;
                }
            }
            if (chosen) break;
        }
    }
    assert.ok(chosen, "Legal discrete inputs can reach platform " + index);
    record(Math.abs(chosen.n), chosen.n > 0 ? 1 : 2);
    record(chosen.charge, 4);
    record(chosen.air, 0);
    if (index === 20) {
        deathStart = structuredClone(climb);
        deathPrefix = structuredClone(segments);
    }
}
const winningProof = { version: 1, initial_angle: initialAngle, segments };
const victory = Rules.replay(winningProof, 120);
assert.equal(victory.isEscaped, 1);
assert.ok(victory.maxHeight >= 130, "The verifier supports the current 130 m well");
response = await send({ ...payload, run_id: runId(120), replay: winningProof });
assert.equal(response.status, 201);
assert.deepEqual((await response.json()).score, victory);
assert.throws(() => Rules.replay({ ...winningProof, segments: [...segments, [1, 0]] }, 120),
    /after run ended/, "A finished run cannot continue accumulating inputs");

// A real fatal fall remains eligible for a named, verified score.
let fatalProof;
for (let turns = 0; turns < 111 && !fatalProof; turns++) {
    const trial = structuredClone(deathStart);
    for (let i = 0; i < turns; i++) Rules.step(trial, 1);
    for (let i = 0; i < 49; i++) Rules.step(trial, 4);
    Rules.step(trial, 0);
    let air = 1;
    while (!trial.onGround && air < 600) { Rules.step(trial, 0); air++; }
    if (trial.dead) fatalProof = { version: 1, initial_angle: initialAngle,
        segments: [...deathPrefix, ...(turns ? [[turns, 1]] : []), [49, 4], [air, 0]] };
}
assert.ok(fatalProof, "Find a legal fatal fall from the climb");
response = await send({ ...payload, player_name: "กบตกบ่อ", run_id: runId(120), replay: fatalProof });
assert.equal(response.status, 201, "Dead players can save their verified statistics");
assert.equal((await response.json()).score.isEscaped, 0);
for (let i = 0; i < 205; i++) sqlite.prepare(
    "INSERT INTO leaderboard (player_name, max_height, clear_time_seconds, verified) VALUES (?, ?, ?, 1)"
).run("rank-" + i, i / 10, 100);
response = await worker.fetch(new Request("https://game.example/api/leaderboard"), env);
const ranked = (await response.json()).data;
assert.equal(ranked.length, 200);
assert.ok(ranked.every((row, i) => !i || ranked[i - 1].max_height >= row.max_height));

// Exercise the real local HTTP API in an isolated folder/database.
const directory = await mkdtemp(join(tmpdir(), "kob-api-test-"));
let child;
try {
    for (const file of ["server.js", "rules.js", "leaderboard-api.js", "schema.sql", "index.html"]) {
        await copyFile(new URL("../" + file, import.meta.url), join(directory, file));
    }
    await mkdir(join(directory, "drizzle"));
    for (const file of migrations) await copyFile(new URL("../drizzle/" + file, import.meta.url), join(directory, "drizzle", file));
    child = spawn(process.execPath, ["server.js"], { cwd: directory, env: { ...process.env, PORT: "0" }, stdio: ["ignore", "pipe", "pipe"] });
    const port = await new Promise((resolve, reject) => {
        let output = "";
        child.stdout.on("data", chunk => {
            output += chunk;
            const match = output.match(/http:\/\/localhost:(\d+)/);
            if (match && Number(match[1])) resolve(Number(match[1]));
        });
        child.once("exit", code => reject(Error("Local server exited " + code)));
        setTimeout(() => reject(Error("Local server startup timeout")), 10000).unref();
    });
    const origin = "http://localhost:" + port;
    assert.equal((await fetch(origin + "/api/leaderboard")).status, 200);
    assert.equal((await fetch(origin + "/api/leaderboard", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(forged)
    })).status, 400, "The local sibling endpoint cannot accept raw forged scores either");
    const session = await (await fetch(origin + "/api/runs", { method: "POST" })).json();
    const quickProof = { ...proof, segments: [[20, 4], [40, 0]] };
    const localScore = { ...payload, run_id: session.run_id, replay: quickProof };
    response = await fetch(origin + "/api/leaderboard", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(localScore) });
    assert.equal(response.status, 201);
    assert.deepEqual((await response.json()).score, Rules.replay(quickProof, 2));
    assert.equal((await fetch(origin + "/leaderboard.db")).status, 404);
    assert.equal((await fetch(origin + "/leaderboard-api.js")).status, 404);
} finally {
    if (child && child.exitCode === null) { child.kill(); await once(child, "exit"); }
    await rm(directory, { recursive: true, force: true });
    sqlite.close();
}
console.log("PASS: deterministic scores, forged fields, invalid/accelerated/expired replay, duplicate/racing submissions, legacy isolation, body bounds, IP quota and real local HTTP API.");
