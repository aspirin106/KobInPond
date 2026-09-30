// Run: node test-platforms.js. Uses the game's pinned Three.js r128; cached in OS temp.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/game.js`, 'utf8');

async function main() {
    const library = path.join(require('node:os').tmpdir(), 'kob-three-r128.cjs');
    if (!fs.existsSync(library)) {
        const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        assert.ok(response.ok, 'Download the exact Three.js version used by the game');
        fs.writeFileSync(library, await response.text());
    }
    const THREE = require(library);
    const WELL_HEIGHT = Number(source.match(/const WELL_HEIGHT = ([\d.]+);/)[1]);
    assert.equal(WELL_HEIGHT, 130, 'The well is twice the original 65 meters');
    const scene = new THREE.Scene();
    const context = vm.createContext({ scene, THREE, WELL_RADIUS: 6.8, WELL_HEIGHT,
        rockMap: new THREE.Texture(), rockNormalMap: new THREE.Texture(), rockRoughnessMap: new THREE.Texture() });
    const setup = source.slice(source.indexOf('// Platforms setup'), source.indexOf('// The Coconut Shell'));
    const contains = source.slice(source.indexOf('function containsPlatformPoint('), source.indexOf('function updatePhysics('));
    vm.runInContext(`${setup}\n${contains}\nglobalThis.result = { platforms, containsPlatformPoint };`, context);
    const { platforms, containsPlatformPoint: containsPoint } = context.result;
    scene.updateMatrixWorld(true);
    assert.equal(scene.children.length, 57);
    for (const [index, group] of scene.children.entries()) {
        assert.equal(group.children.length, index === 56 ? 3 : 1);
        const mesh = group.children[0];
        const p = platforms[index + 1];
        mesh.geometry.computeBoundingBox();
        const bounds = mesh.geometry.boundingBox;
        const size = bounds.getSize(new THREE.Vector3());
        assert.ok(Math.abs(size.y - p.height) < 1e-6);
        assert.ok(mesh.geometry.parameters.options.bevelEnabled);
        assert.equal(mesh.geometry.parameters.options.bevelSegments, 3);
        assert.ok(Math.abs(p.pos.y + p.height / 2 - (group.position.y + 0.22)) < 1e-9);
        assert.ok(Math.hypot(group.position.x, group.position.z) + mesh.position.z + size.z / 2 > 6.8);
        const world = (x, z) => mesh.localToWorld(new THREE.Vector3(x, 0, z));
        assert.ok(containsPoint(p, world(0, 0)));
        assert.equal(p.outline.length, 8);
        for (const [x, z] of p.outline) {
            assert.ok(containsPoint(p, world(x * 0.98, z * 0.98)), 'Footprint includes the flat stone cap');
            assert.ok(!containsPoint(p, world(x * 1.10, z * 1.10)), 'Clipped corners and rounded lips cannot hold the frog');
        }
        assert.ok(!containsPoint(p, world(bounds.max.x + 0.05, 0)));
        assert.ok(!containsPoint(p, world(0, bounds.min.z - 0.05)));
        const positions = mesh.geometry.attributes.position;
        const cap = new Set(p.outline.map(([x, z]) => `${x.toFixed(4)},${z.toFixed(4)}`));
        for (let v = 0; v < positions.count; v++) {
            if (Math.abs(positions.getY(v) - p.height / 2) < 1e-6) {
                assert.ok(cap.has(`${positions.getX(v).toFixed(4)},${positions.getZ(v).toFixed(4)}`), 'Landing polygon matches the actual top vertices');
            }
        }
        if (index > 0) assert.ok(p.pos.y - platforms[index].pos.y < 2.4, 'Height extension preserves jump spacing');
        assert.ok(mesh.material.map && mesh.material.normalMap && mesh.material.roughnessMap);
        for (const attribute of Object.values(mesh.geometry.attributes)) {
            assert.ok(attribute.array.every(Number.isFinite));
        }
    }
    assert.ok(containsPoint(platforms[0], { x: 1, z: 0 }));
    assert.ok(!containsPoint(platforms[0], { x: 1.5, z: 0 }));
    const finish = platforms.at(-1);
    assert.ok(finish.isTopExit && finish.finishRadius === 0.92);
    assert.ok(containsPoint(finish, finish.pos));
    assert.ok(Math.abs(finish.pos.y + finish.height / 2 - WELL_HEIGHT) < 1e-9);
    const finishGroup = scene.children.at(-1);
    const ringCenter = finishGroup.children[1].getWorldPosition(new THREE.Vector3());
    assert.ok(Math.hypot(ringCenter.x - finish.pos.x, ringCenter.z - finish.pos.z) < 1e-6);
    assert.ok(Math.abs(ringCenter.y - WELL_HEIGHT - 0.03) < 1e-6, 'Ring sits above the landing surface');
    // Exercise the game's actual airborne/collision code, including wall rebounds.
    const airborne = source.slice(source.indexOf('physics.vel.y -= GRAVITY * dt;'), source.indexOf('frog.position.copy(physics.pos);')).trim();
    context.GRAVITY = Number(source.match(/const GRAVITY = ([\d.]+);/)[1]);
    context.frogAudio = { playLand() {}, playSplash() {} };
    context.storyMilestones = { firstJump: false };
    context.triggerWaterSplash = context.triggerVictory = () => {};
    context.FATAL_FALL_HEIGHT = Number(source.match(/const FATAL_FALL_HEIGHT = ([\d.]+);/)[1]);
    context.document = { getElementById: () => ({}) };
    context.closeStory = () => {};
    context.deathDialog = { showModal() {} };
    const fatalLanding = source.slice(source.indexOf('function checkFatalLanding('), source.indexOf('function triggerVictory('));
    vm.runInContext(fatalLanding, context);
    vm.runInContext(`globalThis.step = function(dt) { ${airborne.slice(0, -1)} };`, context);
    for (let i = 1; i < platforms.length; i++) {
        const start = platforms[i - 1], target = platforms[i];
        const facing = Math.atan2(target.pos.x - start.pos.x, target.pos.z - start.pos.z);
        let reachable = false;
        for (let power = 0.15; power <= 1.001 && !reachable; power += 0.005) {
            context.physics = { pos: start.pos.clone(), onGround: false,
                vel: new THREE.Vector3(Math.sin(facing), 1.38, Math.cos(facing)).normalize().multiplyScalar(6.2 + power * (18.5 - 6.2)) };
            context.physics.pos.y = i === 1 ? 0.45 : start.pos.y + start.height / 2;
            context.physics.fallPeakY = context.physics.pos.y;
            for (let frame = 0; frame < 240 && !context.physics.onGround; frame++) context.step(1 / 60);
            reachable = containsPoint(target, context.physics.pos) &&
                Math.abs(context.physics.pos.y - (target.pos.y + target.height / 2)) < 1e-6 &&
                (!target.isTopExit || Math.hypot(context.physics.pos.x - target.pos.x, context.physics.pos.z - target.pos.z) <= target.finishRadius);
        }
        assert.ok(reachable, `Jump ${i} reaches the next stone/exit using the original jump power`);
    }
    // Fatal falls hit both stones and water; each landing resets the peak.
    const stone = platforms[10];
    const stoneY = stone.pos.y + stone.height / 2;
    for (const [x, z, landingY] of [[2, 0, 0.38], [stone.pos.x, stone.pos.z, stoneY]]) {
        for (const distance of [19.9, 20, 50]) {
            context.physics = { pos: new THREE.Vector3(x, landingY + 1, z),
                vel: new THREE.Vector3(0, -40, 0), onGround: false, dead: false,
                fallPeakY: landingY + distance };
            context.step(0.05); // Cross the surface in a single frame at high speed.
            assert.equal(context.physics.pos.y, landingY);
            assert.equal(context.physics.dead, distance >= 20);
            assert.equal(context.physics.fallPeakY, landingY);
        }
    }
    for (const distance of [6, 6, 6, 6]) {
        context.physics = { pos: new THREE.Vector3(0, 10, 0), fallPeakY: 10 + distance, dead: false };
        context.checkFatalLanding();
        assert.equal(context.physics.dead, false, 'Small falls do not accumulate into a fatal fall');
    }
    let victories = 0;
    context.triggerVictory = () => { victories++; };
    for (const [offset, expectedVictories] of [[1.05, 0], [0, 1]]) {
        context.physics = { pos: finish.pos.clone(), vel: new THREE.Vector3(0, -2, 0),
            onGround: false, dead: false, fallPeakY: WELL_HEIGHT + 0.7 };
        context.physics.pos.x += offset;
        context.physics.pos.y = WELL_HEIGHT + 0.7;
        context.step(0.08);
        assert.equal(context.physics.onGround, true);
        assert.equal(victories, expectedVictories, 'Only landing inside the marked circle wins');
    }
    // Build the actual vegetation and stone meshes under both render budgets.
    for (const mobile of [true, false]) {
        const env = vm.createContext({ THREE, scene: new THREE.Scene(), WELL_RADIUS: 6.8, WELL_HEIGHT,
            MOBILE_RENDER_BUDGET: mobile, leafMap: new THREE.Texture(), rockMap: new THREE.Texture(),
            rockNormalMap: new THREE.Texture(), rockRoughnessMap: new THREE.Texture(),
            vineMap: new THREE.Texture(), vineNormalMap: new THREE.Texture(), vineRoughnessMap: new THREE.Texture() });
        const environment = source.slice(source.indexOf('const envRoot ='), source.indexOf('// Grassy world outside'));
        vm.runInContext(`${environment}\nglobalThis.result = { ivyLeavesMesh, ivyLeafIdx, fernFanMesh, fernDroopMesh, vineStemMat, wallStones };`, env);
        const meshes = env.result;
        assert.equal(meshes.ivyLeavesMesh.count, meshes.ivyLeafIdx, 'No unfilled leaf instances at the origin');
        for (const mesh of [meshes.ivyLeavesMesh, meshes.fernFanMesh, meshes.fernDroopMesh]) {
            assert.ok(mesh.material.map && mesh.material.alphaTest > 0);
            assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));
        }
        assert.ok(meshes.vineStemMat.map && meshes.vineStemMat.normalMap);
        assert.ok(meshes.wallStones.material.map);
    }
    const sw = fs.readFileSync(`${__dirname}/sw.js`, 'utf8');
    for (const file of fs.readdirSync(`${__dirname}/images/generated`).filter(file => file.endsWith('.webp'))) {
        assert.ok(sw.includes(`./images/generated/${file}`), `${file} is available offline`);
    }
    console.log('PASS: 130m well, 57 stones including the visible finish ring, all 57 jumps reach the next stone/finish circle, fatal falls, desktop/mobile foliage and offline assets.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
