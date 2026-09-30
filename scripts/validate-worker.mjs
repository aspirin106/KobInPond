import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../worker/index.js", import.meta.url), "utf8");
const { default: worker } = await import(
    "data:text/javascript;base64," + Buffer.from(source).toString("base64")
);
const saved = [];
const env = {
    DB: {
        prepare(sql) {
            return {
                bind(...values) {
                    saved.push({ sql, values });
                    return this;
                },
                async run() { return { success: true }; },
                async all() { return { results: [] }; },
            };
        },
    },
    ASSETS: {
        async fetch() { return new Response("game", { headers: { "Content-Type": "text/plain" } }); },
    },
};

const jsonRequest = (body, headers = {}) => new Request("https://game.example/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": crypto.randomUUID(), ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
});
const validScore = {
    player_name: "กบน้อย",
    max_height: 58.2,
    clear_time_seconds: 85.4,
    jump_count: 12,
    is_escaped: 1,
    device_type: "desktop",
};

let response = await worker.fetch(new Request("https://game.example/api/leaderboard"), env);
assert.equal(response.status, 200);
assert.equal((await response.json()).success, true);

response = await worker.fetch(jsonRequest(validScore), env);
assert.equal(response.status, 201);
assert.deepEqual(saved.at(-1).values, ["กบน้อย", 58.2, 85.4, 12, 1, "desktop"]);

response = await worker.fetch(jsonRequest({ ...validScore, is_escaped: "false" }), env);
assert.equal(response.status, 400, "truthy strings cannot forge a victory");
response = await worker.fetch(jsonRequest({ ...validScore, max_height: "58.2" }), env);
assert.equal(response.status, 400, "scores must use JSON numbers");
response = await worker.fetch(jsonRequest("x".repeat(11_000)), env);
assert.equal(response.status, 413, "large request bodies are rejected while streaming");

for (let i = 0; i < 5; i++) {
    response = await worker.fetch(jsonRequest(validScore, {
        "CF-Connecting-IP": "rate-test",
        "X-Forwarded-For": String(i),
    }), env);
    assert.equal(response.status, 201);
}
response = await worker.fetch(jsonRequest(validScore, {
    "CF-Connecting-IP": "rate-test",
    "X-Forwarded-For": "a-different-client-supplied-value",
}), env);
assert.equal(response.status, 429, "client-supplied forwarded IP cannot bypass the rate limit");

response = await worker.fetch(new Request("https://game.example/"), env);
assert.equal(await response.text(), "game");
assert.equal(response.headers.get("x-content-type-options"), "nosniff");
