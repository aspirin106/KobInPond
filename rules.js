// Shared deterministic physics. Only button inputs cross the score trust boundary.
(function () {
    const DT = 1 / 60, MAX_TICKS = 60 * 30 * 60, MAX_SEGMENTS = 10000;
    const platforms = [{ pos: { x: 0, y: .45, z: 0 }, radius: 1.45, height: .5 }];
    const steps = Math.ceil((130 - 5) / 2.25);
    let angle = .35;
    for (let i = 1; i <= steps + 1; i++) {
        const finish = i === steps + 1, progress = i / steps;
        const y = finish ? 130 - .22 : 2.4 + progress * (130 - 5);
        const dist = 6.8 - 1.8 - Math.sin(i * 1.5) * .3;
        angle += 1.35;
        const x = Math.cos(angle) * dist, z = Math.sin(angle) * dist;
        const norm = Math.atan2(z, x);
        const radius = finish ? 1.5 : 1.35 - progress * .22;
        const height = .85 + Math.sin(i * 2.1) * .15;
        const front = radius * 1.65 / 2, back = 6.8 - dist + .45;
        const offset = (back - front) / 2;
        const outline = [[-.48, -.28], [-.28, -.50], [.25, -.47], [.49, -.26],
            [.46, .28], [.25, .50], [-.30, .48], [-.50, .18]].map(([sx, sz], corner) => [
                (sx + Math.sin(i * 3.7 + corner * 2.3) * .045) * (radius * 2.15),
                (sz + Math.cos(i * 2.9 + corner * 1.7) * .035) * (front + back)
            ]);
        platforms.push({ pos: { x: x + Math.cos(norm) * offset,
            y: y + (.44 - height) / 2, z: z + Math.sin(norm) * offset },
            angle: norm, outline, radius, height, isTopExit: finish, finishRadius: finish ? .92 : 0 });
    }
    function contains(p, pos) {
        const dx = pos.x - p.pos.x, dz = pos.z - p.pos.z;
        if (p.angle === undefined) return Math.hypot(dx, dz) <= p.radius;
        const x = dx * Math.sin(p.angle) - dz * Math.cos(p.angle);
        const z = dx * Math.cos(p.angle) + dz * Math.sin(p.angle);
        let inside = false;
        for (let i = 0, j = p.outline.length - 1; i < p.outline.length; j = i++) {
            const [ax, az] = p.outline[i], [bx, bz] = p.outline[j];
            if ((az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax) inside = !inside;
        }
        return inside;
    }
    function createState(initialAngle = 0) {
        return { pos: { x: 0, y: .45, z: 0 }, vel: { x: 0, y: 0, z: 0 },
            facingAngle: initialAngle, onGround: true, charging: false, chargePower: 0,
            jumpCount: 0, reachedWellTop: false, dead: false, fallPeakY: .45,
            previousButtons: 0, started: false, elapsedTicks: 0, maxHeight: .45 };
    }
    function step(s, buttons) {
        const event = {};
        if (s.dead || s.reachedWellTop) return event;
        if (buttons & 1) s.facingAngle += 3.4 * DT;
        if (buttons & 2) s.facingAngle -= 3.4 * DT;
        if ((buttons & 4) && !(s.previousButtons & 4) && s.onGround && !s.charging) {
            s.started = true;
            s.charging = true;
            s.chargePower = .05;
        }
        if (!(buttons & 4) && (s.previousButtons & 4) && s.charging) {
            event.jump = Math.max(.15, s.chargePower);
            const speed = (6.2 + event.jump * (18.5 - 6.2)) / Math.hypot(1, 1.38);
            s.vel.x = Math.sin(s.facingAngle) * speed;
            s.vel.y = 1.38 * speed;
            s.vel.z = Math.cos(s.facingAngle) * speed;
            s.onGround = false;
            s.fallPeakY = s.pos.y;
            s.jumpCount++;
            s.charging = false;
            s.chargePower = 0;
        }
        s.previousButtons = buttons;
        if (s.started) s.elapsedTicks++;
        if (s.charging) s.chargePower = Math.min(1, s.chargePower + DT * 1.18);
        if (!s.onGround) {
            s.vel.y -= 26 * DT;
            s.fallPeakY = Math.max(s.fallPeakY, s.pos.y);
            const previousY = s.pos.y;
            s.pos.x += s.vel.x * DT;
            s.pos.y += s.vel.y * DT;
            s.pos.z += s.vel.z * DT;
            const distance = Math.hypot(s.pos.x, s.pos.z), maxRadius = 6.8 - .58;
            if (distance > maxRadius) {
                s.pos.x *= maxRadius / distance;
                s.pos.z *= maxRadius / distance;
                s.vel.x *= -.35; s.vel.z *= -.35;
                event.land = true;
            }
            let landing = null;
            if (s.vel.y < 0) {
                for (const p of platforms) {
                    const top = p.pos.y + p.height / 2;
                    if ((Math.abs(s.pos.y - top) < .62 ||
                        (previousY >= top && s.pos.y <= top)) && contains(p, s.pos)) {
                        s.pos.y = top; landing = p; event.land = true; break;
                    }
                }
            }
            if (s.pos.y <= .38) {
                event.splash = Math.max(1, Math.abs(s.vel.y) * .14);
                s.pos.y = .38; landing = {};
            }
            if (landing) {
                s.vel.x = s.vel.y = s.vel.z = 0;
                s.onGround = true;
                const fall = s.fallPeakY - s.pos.y;
                s.fallPeakY = s.pos.y;
                if (fall >= 20) {
                    s.dead = true; s.charging = false; event.death = fall;
                } else if (landing.isTopExit &&
                    Math.hypot(s.pos.x - landing.pos.x, s.pos.z - landing.pos.z) <= landing.finishRadius) {
                    s.reachedWellTop = true; event.victory = true;
                }
            }
        }
        s.maxHeight = Math.max(s.maxHeight, s.pos.y);
        return event;
    }
    function replay(proof, wallSeconds) {
        if (!proof || proof.version !== 1 || !Number.isFinite(proof.initial_angle) ||
            Math.abs(proof.initial_angle) > Math.PI * 2 ||
            !Array.isArray(proof.segments) || !proof.segments.length ||
            proof.segments.length > MAX_SEGMENTS) throw Error("Invalid replay");
        let ticks = 0;
        for (const segment of proof.segments) {
            if (!Array.isArray(segment) || segment.length !== 2 ||
                !Number.isInteger(segment[0]) || segment[0] < 1 ||
                !Number.isInteger(segment[1]) || segment[1] < 0 || segment[1] > 7) throw Error("Invalid input");
            ticks += segment[0];
            if (ticks > MAX_TICKS) throw Error("Run is too long");
        }
        if (!(proof.segments[0][1] & 4) || ticks * DT > wallSeconds + 2) throw Error("Invalid run duration");
        const state = createState(proof.initial_angle);
        for (const [count, buttons] of proof.segments) {
            for (let tick = 0; tick < count; tick++) {
                if (state.dead || state.reachedWellTop) throw Error("Inputs after run ended");
                step(state, buttons);
            }
        }
        if (!state.jumpCount) throw Error("Jump before saving a score");
        return { maxHeight: Math.round(state.maxHeight * 100) / 100,
            clearTime: Math.round(state.elapsedTicks * DT * 100) / 100,
            jumpCount: state.jumpCount, isEscaped: state.reachedWellTop ? 1 : 0 };
    }
    const api = { DT, MAX_TICKS, MAX_SEGMENTS, platforms, contains, createState, step, replay };
    globalThis.KobRules = api;
    if (typeof module !== "undefined") module.exports = api;
})();
