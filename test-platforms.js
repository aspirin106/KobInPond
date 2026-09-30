// Run: node test-platforms.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/game.js`, 'utf8');
class Vector {
    constructor(x = 0, y = 0, z = 0) { this.set(x, y, z); }
    set(x, y, z) { Object.assign(this, { x, y, z }); }
}
class Group {
    constructor() { this.position = new Vector(); this.rotation = new Vector(); this.children = []; }
    add(child) { this.children.push(child); }
}
class Mesh extends Group {
    constructor(geometry, material) { super(); Object.assign(this, { geometry, material }); }
}
const scene = new Group();
const context = vm.createContext({
    scene, WELL_RADIUS: 6.8, WELL_HEIGHT: 65,
    WELL_PBR_BASECOLOR: 'color', WELL_PBR_NORMAL: 'normal', WELL_PBR_ROUGHNESS: 'roughness',
    loadWellPBRTexture: () => ({ repeat: new Vector(), offset: new Vector() }),
    THREE: { Vector3: Vector, Vector2: Vector, Group, Mesh,
        BoxGeometry: class { constructor(width, height, depth) { Object.assign(this, { width, height, depth }); } },
        MeshStandardMaterial: class { constructor(options) { Object.assign(this, options); } } }
});
const setup = source.slice(source.indexOf('// Platforms setup'), source.indexOf('// The Coconut Shell'));
const contains = source.slice(source.indexOf('function containsPlatformPoint('), source.indexOf('function updatePhysics('));
vm.runInContext(`${setup}\n${contains}\nglobalThis.result = { platforms, containsPlatformPoint };`, context);
const { platforms, containsPlatformPoint: containsPoint } = context.result;
assert.equal(scene.children.length, 27);
for (const [index, group] of scene.children.entries()) {
    assert.equal(group.children.length, 1, 'Each step is one solid brick');
    const mesh = group.children[0];
    const p = platforms[index + 1];
    const { width, height, depth } = mesh.geometry;
    assert.ok(height >= 0.8);
    assert.ok(Math.abs(p.pos.y + p.height / 2 - (group.position.y + 0.22)) < 1e-9, 'Landing height stays unchanged');
    assert.ok(Math.hypot(group.position.x, group.position.z) + mesh.position.z + depth / 2 > 6.8, 'Rear end is embedded in the wall');
    const worldPoint = (x, z) => ({
        x: group.position.x + x * Math.cos(group.rotation.y) + (z + mesh.position.z) * Math.sin(group.rotation.y),
        z: group.position.z - x * Math.sin(group.rotation.y) + (z + mesh.position.z) * Math.cos(group.rotation.y)
    });
    assert.ok(containsPoint(p, worldPoint(0, 0)), 'Visible center supports landing');
    assert.ok(containsPoint(p, worldPoint(width * 0.49, depth * 0.49)), 'Visible corner supports landing');
    assert.ok(!containsPoint(p, worldPoint(width / 2 + 0.05, 0)), 'No invisible ledge beside the brick');
    assert.ok(!containsPoint(p, worldPoint(0, -depth / 2 - 0.05)), 'No invisible ledge in front of the brick');
    assert.ok(mesh.material.map && mesh.material.normalMap && mesh.material.roughnessMap);
}
assert.ok(containsPoint(platforms[0], { x: 1, z: 0 }));
assert.ok(!containsPoint(platforms[0], { x: 1.5, z: 0 }));
assert.ok(containsPoint(platforms.at(-1), { x: 6.8, z: 0 }));
console.log('PASS: 27 solid wall bricks, unchanged landing heights, rotated footprints, coconut and exit.');
