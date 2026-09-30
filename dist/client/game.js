/* Procedural Web Audio for rich cartoon sounds without external assets */
        class ProceduralAudio {
            constructor() {
                this.ctx = null;
                this.enabled = true;
            }

            ensureContext() {
                if (!this.ctx) {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (AudioContextClass) this.ctx = new AudioContextClass();
                }
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume();
                }
            }

            playCroak() {
                if (!this.enabled) return;
                this.ensureContext();
                if (!this.ctx) return;
                try {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const filter = this.ctx.createBiquadFilter();

                    osc.type = 'sawtooth';
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(420, this.ctx.currentTime);

                    osc.frequency.setValueAtTime(170, this.ctx.currentTime);
                    osc.frequency.linearRampToValueAtTime(75, this.ctx.currentTime + 0.13);

                    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);

                    osc.start();
                    osc.stop(this.ctx.currentTime + 0.15);
                } catch(e) {}
            }

            playJump(power) {
                if (!this.enabled) return;
                this.ensureContext();
                if (!this.ctx) return;
                try {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();

                    osc.type = 'sine';
                    const baseFreq = 180 + power * 260;
                    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, this.ctx.currentTime + 0.23);

                    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);

                    osc.start();
                    osc.stop(this.ctx.currentTime + 0.26);
                } catch(e) {}
            }

            playLand() {
                if (!this.enabled) return;
                this.ensureContext();
                if (!this.ctx) return;
                try {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();

                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(32, this.ctx.currentTime + 0.11);

                    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);

                    osc.start();
                    osc.stop(this.ctx.currentTime + 0.13);
                } catch(e) {}
            }

            playSplash() {
                if (!this.enabled) return;
                this.ensureContext();
                if (!this.ctx) return;
                try {
                    const bufferSize = this.ctx.sampleRate * 0.22;
                    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

                    const noise = this.ctx.createBufferSource();
                    noise.buffer = buffer;

                    const filter = this.ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(700, this.ctx.currentTime);
                    filter.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.22);

                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

                    noise.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);

                    noise.start();
                    noise.stop(this.ctx.currentTime + 0.22);
                } catch(e) {}
            }

            playFanfare() {
                if (!this.enabled) return;
                this.ensureContext();
                if (!this.ctx) return;
                const notes = [261.6, 329.6, 392.0, 523.2, 659.2, 784.0];
                notes.forEach((freq, idx) => {
                    setTimeout(() => {
                        try {
                            const osc = this.ctx.createOscillator();
                            const gain = this.ctx.createGain();
                            osc.type = 'triangle';
                            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                            gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
                            osc.connect(gain);
                            gain.connect(this.ctx.destination);
                            osc.start();
                            osc.stop(this.ctx.currentTime + 0.38);
                        } catch(e) {}
                    }, idx * 110);
                });
            }
        }

        const frogAudio = new ProceduralAudio();
        const WELL_RADIUS = 6.8;
        const WELL_HEIGHT = 130.0;

        const container = document.getElementById('canvas-container');
        const scene = new THREE.Scene();
        const MOBILE_RENDER_BUDGET = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || Math.min(window.innerWidth, window.innerHeight) < 720;
        scene.fog = new THREE.FogExp2(0x06100b, 0.0235);

        const getW = () => container.clientWidth || window.innerWidth || 800;
        const getH = () => container.clientHeight || window.innerHeight || 600;

        const camera = new THREE.PerspectiveCamera(54, getW() / getH(), 0.1, 300);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        } catch(e) {
            renderer = new THREE.WebGLRenderer({ antialias: false });
        }
        renderer.setSize(getW(), getH());
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE_RENDER_BUDGET ? 1.65 : 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.90;
        container.appendChild(renderer.domElement);

        // Environment polish: richer depth while keeping the scene lightweight
        scene.background = new THREE.Color(0x020704);
        scene.fog = new THREE.FogExp2(0x040d08, 0.022);

        // ------------------------------------------------------------------
        // STEP 2: 3-ZONE LIGHTING (Upper Warm -> Mid Green -> Bottom Cool Damp)
        // ------------------------------------------------------------------
        // Base Ambient: Dim, mossy tone so contrast between top and bottom is dramatic
        const ambientLight = new THREE.AmbientLight(0x18281f, 0.42);
        scene.add(ambientLight);

        // Hemisphere Light: Bright canopy sky above, deep cavern darkness below
        const hemiLight = new THREE.HemisphereLight(0xa5cfa8, 0x050c07, 0.40);
        scene.add(hemiLight);

        // 1. UPPER ZONE: Warm direct sunlight from well opening grazing down the PBR stone
        const sunLight = new THREE.DirectionalLight(0xfff3d6, 3.6);
        sunLight.position.set(6.5, WELL_HEIGHT + 13, 3.8);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = MOBILE_RENDER_BUDGET ? 768 : 1024;
        sunLight.shadow.mapSize.height = MOBILE_RENDER_BUDGET ? 768 : 1024;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = WELL_HEIGHT + 50;
        const d = 11;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;
        sunLight.shadow.bias = -0.0004;
        scene.add(sunLight);

        // Warm shaft beam from opening rim
        const openingLight = new THREE.SpotLight(0xffe8b5, 2.8, WELL_HEIGHT + 30, 0.44, 0.85, 1.3);
        openingLight.position.set(3.0, WELL_HEIGHT + 7, 1.2);
        openingLight.target.position.set(0, 10, 0);
        scene.add(openingLight);
        scene.add(openingLight.target);

        // 2. MIDDLE ZONE: Darker mossy green diffuse ambiance
        const midBounce = new THREE.PointLight(0x2d5c34, 0.45, WELL_HEIGHT * 0.5);
        midBounce.position.set(2.2, WELL_HEIGHT * 0.52, -1.8);
        scene.add(midBounce);

        const midBounce2 = new THREE.PointLight(0x1f4a28, 0.35, WELL_HEIGHT * 0.43);
        midBounce2.position.set(-2.0, WELL_HEIGHT * 0.34, 1.6);
        scene.add(midBounce2);

        // 3. BOTTOM ZONE: Cool, damp groundwater reflection
        const lowerBounce = new THREE.PointLight(0x124a40, 0.65, 22);
        lowerBounce.position.set(0, 3.5, 0);
        scene.add(lowerBounce);

        // 4. FROG GLOW: Follows voxel hero so it remains clearly readable against dark walls
        const frogGlowLight = new THREE.PointLight(0xc8ffd6, 1.35, 9.5);
        scene.add(frogGlowLight);

        function generateStoneWallTextures() {
            const size = 1024;
            const colorCanvas = document.createElement('canvas');
            const bumpCanvas = document.createElement('canvas');
            colorCanvas.width = colorCanvas.height = size;
            bumpCanvas.width = bumpCanvas.height = size;
            const c = colorCanvas.getContext('2d');
            const b = bumpCanvas.getContext('2d');

            // Stable texture every launch so the well keeps the same visual identity.
            let seed = 0xC0C0A11;
            const rnd = () => {
                seed = (seed * 1664525 + 1013904223) >>> 0;
                return seed / 4294967296;
            };

            c.fillStyle = '#172019';
            c.fillRect(0, 0, size, size);
            b.fillStyle = '#3a3a3a';
            b.fillRect(0, 0, size, size);

            let y = -18;
            let row = 0;
            while (y < size + 30) {
                const h = 43 + rnd() * 19;
                let x = (row % 2 ? -78 : -18) - rnd() * 45;
                while (x < size + 60) {
                    const w = 92 + rnd() * 85;
                    const inset = 7 + rnd() * 5;
                    const x0 = x + inset;
                    const y0 = y + inset * 0.72;
                    const x1 = x + w - inset;
                    const y1 = y + h - inset * 0.72;
                    const j = 4 + rnd() * 7;

                    const pts = [
                        [x0 + rnd()*j, y0 + rnd()*j],
                        [x1 - rnd()*j, y0 + rnd()*j],
                        [x1 - rnd()*j, y1 - rnd()*j],
                        [x0 + rnd()*j, y1 - rnd()*j]
                    ];

                    const base = 48 + Math.floor(rnd() * 30);
                    const green = base + 8 + Math.floor(rnd() * 11);
                    const blue = base + 4 + Math.floor(rnd() * 8);

                    c.beginPath();
                    c.moveTo(pts[0][0], pts[0][1]);
                    for (let p = 1; p < pts.length; p++) c.lineTo(pts[p][0], pts[p][1]);
                    c.closePath();
                    c.fillStyle = `rgb(${base}, ${green}, ${blue})`;
                    c.fill();
                    c.strokeStyle = 'rgba(9, 14, 10, 0.94)';
                    c.lineWidth = 7 + rnd() * 3;
                    c.stroke();

                    // Hand-painted bevel: bright upper lip, deep lower edge.
                    c.strokeStyle = 'rgba(164, 180, 155, 0.16)';
                    c.lineWidth = 2.2;
                    c.beginPath();
                    c.moveTo(pts[0][0] + 3, pts[0][1] + 3);
                    c.lineTo(pts[1][0] - 3, pts[1][1] + 3);
                    c.stroke();
                    c.strokeStyle = 'rgba(0, 0, 0, 0.24)';
                    c.beginPath();
                    c.moveTo(pts[3][0] + 3, pts[3][1] - 2);
                    c.lineTo(pts[2][0] - 3, pts[2][1] - 2);
                    c.stroke();

                    // Mineral freckles and damp discoloration.
                    for (let f = 0; f < 7; f++) {
                        const fx = x0 + rnd() * Math.max(2, x1 - x0);
                        const fy = y0 + rnd() * Math.max(2, y1 - y0);
                        const rr = 1 + rnd() * 4;
                        c.fillStyle = rnd() > 0.5 ? 'rgba(196,204,183,0.055)' : 'rgba(4,15,10,0.11)';
                        c.beginPath(); c.arc(fx, fy, rr, 0, Math.PI*2); c.fill();
                    }

                    // Height map for fake relief without extra wall geometry.
                    b.beginPath();
                    b.moveTo(pts[0][0], pts[0][1]);
                    for (let p = 1; p < pts.length; p++) b.lineTo(pts[p][0], pts[p][1]);
                    b.closePath();
                    const bumpShade = 145 + Math.floor(rnd() * 74);
                    b.fillStyle = `rgb(${bumpShade},${bumpShade},${bumpShade})`;
                    b.fill();
                    b.strokeStyle = '#222';
                    b.lineWidth = 8;
                    b.stroke();

                    // Moss grows mostly on upper/side edges of stones.
                    if (rnd() > 0.43) {
                        const patches = 1 + Math.floor(rnd() * 3);
                        for (let m = 0; m < patches; m++) {
                            const mx = x0 + rnd() * (x1 - x0);
                            const my = rnd() > 0.42 ? y0 + rnd()*10 : y0 + rnd()*(y1-y0);
                            const rx = 8 + rnd() * 25;
                            const ry = 4 + rnd() * 12;
                            c.fillStyle = `rgba(${25 + Math.floor(rnd()*20)}, ${70 + Math.floor(rnd()*48)}, ${25 + Math.floor(rnd()*18)}, ${0.20 + rnd()*0.27})`;
                            c.beginPath();
                            c.ellipse(mx, my, rx, ry, rnd()*1.2, 0, Math.PI*2);
                            c.fill();
                        }
                    }

                    x += w;
                }
                y += h;
                row++;
            }

            // Long wet streaks from groundwater seepage.
            for (let i = 0; i < 52; i++) {
                const sx = rnd() * size;
                const sy = rnd() * size * 0.75;
                const len = 50 + rnd() * 180;
                const grad = c.createLinearGradient(sx, sy, sx + 4, sy + len);
                grad.addColorStop(0, 'rgba(4,12,8,0.01)');
                grad.addColorStop(0.18, 'rgba(4,12,8,0.20)');
                grad.addColorStop(0.75, 'rgba(2,9,6,0.14)');
                grad.addColorStop(1, 'rgba(2,9,6,0.01)');
                c.strokeStyle = grad;
                c.lineWidth = 2 + rnd() * 5;
                c.beginPath();
                c.moveTo(sx, sy);
                c.bezierCurveTo(sx + (rnd()-.5)*12, sy+len*.35, sx+(rnd()-.5)*10, sy+len*.7, sx+(rnd()-.5)*8, sy+len);
                c.stroke();
            }

            const color = new THREE.CanvasTexture(colorCanvas);
            const bump = new THREE.CanvasTexture(bumpCanvas);
            [color, bump].forEach(tex => {
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(4.3, 18.5);
                tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            });
            return { color, bump };
        }

        function generateCoconutTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#452712';
            ctx.fillRect(0, 0, 256, 256);

            ctx.strokeStyle = '#2b1609';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 350; i++) {
                ctx.beginPath();
                const x = Math.random() * 256;
                const y = Math.random() * 256;
                ctx.moveTo(x, y);
                ctx.lineTo(x + (Math.random() - 0.5) * 8, y + 10 + Math.random() * 16);
                ctx.stroke();
            }
            return new THREE.CanvasTexture(canvas);
        }

        /*
           Camera Cutaway Through Wall:
           By using standard CylinderGeometry with THREE.BackSide:
           - From the inside: all walls are fully rendered with brick textures.
           - From the outside: the wall between the camera and the frog is automatically
             backface-culled (100% see-through/transparent).
           - This allows orbiting the camera at any angle or distance through the wall,
             ensuring the frog is ALWAYS visible without any wall obstruction or clipping!
        */
        const wellGeo = new THREE.CylinderGeometry(WELL_RADIUS, WELL_RADIUS, WELL_HEIGHT, 56, 1, true);

        // PBR STONE WALL TEST
        // Four generated maps are embedded in this HTML so the mobile download remains one self-contained file.
        // BaseColor = visible stone/moss colour, Normal = relief, Roughness = dry/wet response, AO = crevice depth.
        if (wellGeo.attributes.uv && !wellGeo.attributes.uv2) {
            wellGeo.setAttribute('uv2', new THREE.BufferAttribute(wellGeo.attributes.uv.array.slice(), 2));
        }

        const WELL_PBR_BASECOLOR = (window.WELL_PBR_DATA && window.WELL_PBR_DATA.basecolor) || 'images/well_stone_basecolor.webp';
        const WELL_PBR_NORMAL = (window.WELL_PBR_DATA && window.WELL_PBR_DATA.normal) || 'images/well_stone_normal.webp';
        const WELL_PBR_ROUGHNESS = (window.WELL_PBR_DATA && window.WELL_PBR_DATA.roughness) || 'images/well_stone_roughness.webp';
        const WELL_PBR_AO = (window.WELL_PBR_DATA && window.WELL_PBR_DATA.ao) || 'images/well_stone_ao.webp';

        const wellTextureLoader = new THREE.TextureLoader();

        // PBR Wall Scale Presets:
        // Whole integer repeat.x ensures 100% seamless 360° wrapping on CylinderGeometry.
        // Double vertical repeats with the well height to preserve stone scale.
        const WALL_PBR_PRESETS = [
            { name: '6x18 (Chunky / มาตรฐาน)', rx: 6, ry: 18, desc: 'หินก้อนโต สัดส่วน 1:1 ไร้รอยต่อ 360°' },
            { name: '8x24 (Refined / ก้อนถี่)', rx: 8, ry: 24, desc: 'หินก้อนย่อย รายละเอียดถี่ สมจริง' },
            { name: '3.2x21 (Old Test / บั๊ก Seam)', rx: 3.2, ry: 21, desc: 'แบบทดสอบเดิม (หินยืดแบน มีรอยต่อไม่เนียน)' }
        ];
        let currentWallPresetIdx = 0;

        function loadWellPBRTexture(dataUri, isColor = false) {
            const tex = wellTextureLoader.load(dataUri);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(WALL_PBR_PRESETS[0].rx, WALL_PBR_PRESETS[0].ry);
            tex.anisotropy = Math.min(MOBILE_RENDER_BUDGET ? 4 : 8, renderer.capabilities.getMaxAnisotropy());
            if (isColor) tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        function loadGameTexture(name, isColor = true) {
            const tex = loadWellPBRTexture(`images/generated/${name}.webp`, isColor);
            tex.repeat.set(1, 1);
            return tex;
        }

        const leafMap = loadGameTexture('leaf-albedo');
        const rockMap = loadGameTexture('rock-albedo');
        const rockNormalMap = loadGameTexture('rock-normal', false);
        const rockRoughnessMap = loadGameTexture('rock-roughness', false);
        const vineMap = loadGameTexture('vine-albedo');
        const vineNormalMap = loadGameTexture('vine-normal', false);
        const vineRoughnessMap = loadGameTexture('vine-roughness', false);
        // TubeGeometry's U follows the length. Rotate vertical bark ridges into that direction.
        [vineMap, vineNormalMap, vineRoughnessMap].forEach(tex => {
            tex.rotation = Math.PI / 2;
            tex.repeat.set(1, 8);
        });

        const wellBaseColorMap = loadWellPBRTexture(WELL_PBR_BASECOLOR, true);
        const wellNormalMap = loadWellPBRTexture(WELL_PBR_NORMAL, false);
        const wellRoughnessMap = loadWellPBRTexture(WELL_PBR_ROUGHNESS, false);
        const wellAoMap = loadWellPBRTexture(WELL_PBR_AO, false);

        const wellMat = new THREE.MeshStandardMaterial({
            map: wellBaseColorMap,
            normalMap: wellNormalMap,
            normalScale: new THREE.Vector2(0.85, 0.85),
            roughnessMap: wellRoughnessMap,
            roughness: 0.90,
            aoMap: wellAoMap,
            aoMapIntensity: 0.90,
            metalness: 0.0,
            color: 0xffffff,
            side: THREE.BackSide // Keeps the original outside-camera cutaway behavior.
        });
        const wellMesh = new THREE.Mesh(wellGeo, wellMat);
        wellMesh.position.y = WELL_HEIGHT / 2;
        wellMesh.receiveShadow = true;
        scene.add(wellMesh);

        function applyWallScalePreset(idx) {
            currentWallPresetIdx = idx % WALL_PBR_PRESETS.length;
            const p = WALL_PBR_PRESETS[currentWallPresetIdx];
            [wellBaseColorMap, wellNormalMap, wellRoughnessMap, wellAoMap].forEach(tex => {
                tex.repeat.set(p.rx, p.ry);
                tex.needsUpdate = true;
            });
            return p;
        }

        // ------------------------------------------------------------------
        // ENVIRONMENT SET DRESSING (visual-only, no gameplay collision)
        // ------------------------------------------------------------------
        const envRoot = new THREE.Group();
        scene.add(envRoot);

        // Deterministic pseudo-random generator so the environment stays stable
        let envSeed = 87321;
        function envRand() {
            envSeed = (envSeed * 1664525 + 1013904223) >>> 0;
            return envSeed / 4294967296;
        }

        // STEP 4: SEMI-REALISTIC VEGETATION (Vines, Ferns, Roots, Moss Clusters & Floating Leaves)
        // ---------------------------------------------------------------------------------------
        const vegGroup = new THREE.Group();
        envRoot.add(vegGroup);

        // 1. MOSS CLUSTERS (2 Color Variants via InstancedMesh for 60 FPS)
        // Flattened pillows hugging wall mortar & platform perimeters
        const mossGeo = new THREE.DodecahedronGeometry(0.22, 1);
        mossGeo.scale(1.4, 0.45, 0.55); // natural flattened cushion

        const mossMatDark = new THREE.MeshStandardMaterial({ map: rockMap, normalMap: rockNormalMap, color: 0x46683c, roughness: 1.0 });
        const mossMatLight = new THREE.MeshStandardMaterial({ map: rockMap, normalMap: rockNormalMap, color: 0x6c8a4c, roughness: 0.95 });

        const mossCount = MOBILE_RENDER_BUDGET ? 36 : 64;
        const mossMeshA = new THREE.InstancedMesh(mossGeo, mossMatDark, mossCount);
        const mossMeshB = new THREE.InstancedMesh(mossGeo, mossMatLight, mossCount);
        const vegDummy = new THREE.Object3D();

        for (let i = 0; i < mossCount; i++) {
            // Layer A: Deep damp moss (denser in lower-middle zone)
            const aA = envRand() * Math.PI * 2;
            const yA = 1.8 + envRand() * (WELL_HEIGHT - 6);
            const rA = WELL_RADIUS - 0.08;
            vegDummy.position.set(Math.cos(aA) * rA, yA, Math.sin(aA) * rA);
            vegDummy.rotation.set(envRand() * 0.4, -aA - Math.PI / 2, envRand() * 0.4);
            const scA = 0.75 + envRand() * 1.35;
            vegDummy.scale.set(scA, scA * (0.8 + envRand() * 0.5), scA);
            vegDummy.updateMatrix();
            mossMeshA.setMatrixAt(i, vegDummy.matrix);

            // Layer B: Vibrant lime velvet moss (more in middle-upper light zone)
            const aB = envRand() * Math.PI * 2;
            const yB = 10.0 + envRand() * (WELL_HEIGHT - 12);
            const rB = WELL_RADIUS - 0.08;
            vegDummy.position.set(Math.cos(aB) * rB, yB, Math.sin(aB) * rB);
            vegDummy.rotation.set(envRand() * 0.4, -aB - Math.PI / 2, envRand() * 0.4);
            const scB = 0.65 + envRand() * 1.15;
            vegDummy.scale.set(scB, scB * (0.7 + envRand() * 0.6), scB);
            vegDummy.updateMatrix();
            mossMeshB.setMatrixAt(i, vegDummy.matrix);
        }
        mossMeshA.instanceMatrix.needsUpdate = true;
        mossMeshB.instanceMatrix.needsUpdate = true;
        mossMeshA.receiveShadow = true;
        mossMeshB.receiveShadow = true;
        vegGroup.add(mossMeshA);
        vegGroup.add(mossMeshB);

        // 2. FERN VARIANTS (2 Variants via InstancedMesh)
        // Variant 1: Wall-Crevice Fan Fern (Spreading rosette of fronds)
        // Variant 2: Drooping Shelf Fern (Arching cascade over ledges)
        const fernMatA = new THREE.MeshStandardMaterial({ map: leafMap, color: 0xe0ebce, alphaTest: 0.45, roughness: 0.88, side: THREE.DoubleSide });
        const fernMatB = fernMatA.clone();
        fernMatB.color.setHex(0xc6d9ab);

        // Fan fern geometry: curved blades
        const fernFanGeo = new THREE.PlaneGeometry(0.44, 0.68, 2, 4);
        const posFan = fernFanGeo.attributes.position;
        for (let i = 0; i < posFan.count; i++) {
            const y = posFan.getY(i);
            if (y > 0.1) {
                posFan.setZ(i, (y * y) * 0.25);
            }
        }
        fernFanGeo.computeVertexNormals();

        const fernCount = MOBILE_RENDER_BUDGET ? 24 : 44;
        const fernFanMesh = new THREE.InstancedMesh(fernFanGeo, fernMatA, fernCount * 3);
        let fanIdx = 0;
        for (let i = 0; i < fernCount; i++) {
            const a = envRand() * Math.PI * 2;
            const y = 3.5 + envRand() * (WELL_HEIGHT - 8);
            const r = WELL_RADIUS - 0.10;
            const cx = Math.cos(a) * r;
            const cz = Math.sin(a) * r;
            const baseRotY = -a - Math.PI / 2;

            for (let b = 0; b < 3; b++) {
                vegDummy.position.set(cx, y, cz);
                vegDummy.rotation.set(-0.25 + (b - 1) * 0.35, baseRotY, (b - 1) * 0.38);
                const s = 0.85 + envRand() * 0.65;
                vegDummy.scale.set(s, s, s);
                vegDummy.updateMatrix();
                fernFanMesh.setMatrixAt(fanIdx++, vegDummy.matrix);
            }
        }
        fernFanMesh.instanceMatrix.needsUpdate = true;
        vegGroup.add(fernFanMesh);

        // Drooping fern geometry (arching downwards over ledges)
        const fernDroopGeo = new THREE.PlaneGeometry(0.42, 0.72, 2, 4);
        const posDroop = fernDroopGeo.attributes.position;
        for (let i = 0; i < posDroop.count; i++) {
            const y = posDroop.getY(i);
            if (y > 0.0) {
                posDroop.setZ(i, -(y * y) * 0.35);
            }
        }
        fernDroopGeo.computeVertexNormals();

        const droopCount = MOBILE_RENDER_BUDGET ? 18 : 32;
        const fernDroopMesh = new THREE.InstancedMesh(fernDroopGeo, fernMatB, droopCount * 2);
        let droopIdx = 0;
        for (let i = 0; i < droopCount; i++) {
            const a = envRand() * Math.PI * 2;
            const y = 6.0 + envRand() * (WELL_HEIGHT - 10);
            const r = WELL_RADIUS - 0.10;
            const cx = Math.cos(a) * r;
            const cz = Math.sin(a) * r;
            const baseRotY = -a - Math.PI / 2;

            for (let b = 0; b < 2; b++) {
                vegDummy.position.set(cx, y, cz);
                vegDummy.rotation.set(0.65 + (b - 0.5) * 0.28, baseRotY, (b - 0.5) * 0.40);
                const s = 0.80 + envRand() * 0.60;
                vegDummy.scale.set(s, s, s);
                vegDummy.updateMatrix();
                fernDroopMesh.setMatrixAt(droopIdx++, vegDummy.matrix);
            }
        }
        fernDroopMesh.instanceMatrix.needsUpdate = true;
        vegGroup.add(fernDroopMesh);

        // 3. VINES (3 Variants: Creeping Ivy, Hanging Lianas, Twisted Tendrils)
        const vineStemMat = new THREE.MeshStandardMaterial({ map: vineMap, normalMap: vineNormalMap, normalScale: new THREE.Vector2(0.5, 0.5), roughnessMap: vineRoughnessMap, roughness: 0.94 });
        const vineLeafMat = fernMatA;
        const vineLeafGeo = new THREE.PlaneGeometry(0.36, 0.43, 2, 3);
        const leafPos = vineLeafGeo.attributes.position;
        for (let i = 0; i < leafPos.count; i++) {
            leafPos.setZ(i, 0.04 * Math.sin((leafPos.getY(i) / 0.43 + 0.5) * Math.PI));
        }
        vineLeafGeo.computeVertexNormals();

        // Pre-count leaves for Ivy InstancedMesh
        const ivyCount = MOBILE_RENDER_BUDGET ? 6 : 10;
        const ivyLeavesMesh = new THREE.InstancedMesh(vineLeafGeo, vineLeafMat, ivyCount * 12);
        let ivyLeafIdx = 0;

        // Variant 1: Creeping Ivy with leaves hugging the wall
        for (let i = 0; i < ivyCount; i++) {
            const a = envRand() * Math.PI * 2;
            const startY = 12 + envRand() * (WELL_HEIGHT - 20);
            const len = 6 + envRand() * 12;
            const points = [];
            for (let p = 0; p < 7; p++) {
                const t = p / 6;
                const sway = Math.sin(t * Math.PI * 2.2 + i * 1.5) * (0.08 + envRand() * 0.08);
                const aa = a + sway;
                const rr = WELL_RADIUS - 0.12 - Math.sin(t * Math.PI) * 0.03;
                const pt = new THREE.Vector3(Math.cos(aa) * rr, startY - t * len, Math.sin(aa) * rr);
                points.push(pt);

                // Add ivy leaves along the spine
                if (p > 0 && ivyLeafIdx < ivyCount * 12) {
                    for (let lf = 0; lf < 2; lf++) {
                        const side = lf === 0 ? 1 : -1;
                        vegDummy.position.set(
                            pt.x + Math.sin(aa) * side * 0.12,
                            pt.y + (envRand() - 0.5) * 0.15,
                            pt.z - Math.cos(aa) * side * 0.12
                        );
                        vegDummy.rotation.set(envRand() * 0.4, -aa - Math.PI / 2, (envRand() - 0.5) * 0.5);
                        vegDummy.scale.setScalar(0.7 + envRand() * 0.7);
                        vegDummy.updateMatrix();
                        ivyLeavesMesh.setMatrixAt(ivyLeafIdx++, vegDummy.matrix);
                    }
                }
            }
            const curve = new THREE.CatmullRomCurve3(points);
            const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, MOBILE_RENDER_BUDGET ? 24 : 36, 0.028, 8, false), vineStemMat);
            tube.receiveShadow = true;
            vegGroup.add(tube);
        }
        ivyLeavesMesh.instanceMatrix.needsUpdate = true;
        vegGroup.add(ivyLeavesMesh);

        // Variant 2: Hanging Canopy Lianas (Drooping from opening downwards)
        const lianaCount = MOBILE_RENDER_BUDGET ? 5 : 8;
        for (let i = 0; i < lianaCount; i++) {
            const a = envRand() * Math.PI * 2;
            const startY = WELL_HEIGHT + 0.3;
            const len = 8 + envRand() * 16;
            const points = [];
            for (let p = 0; p < 6; p++) {
                const t = p / 5;
                const droopIn = Math.sin(t * Math.PI * 0.7) * (0.18 + envRand() * 0.15);
                const aa = a + Math.sin(t * 3.0 + i) * 0.05;
                const rr = (WELL_RADIUS - 0.15) - droopIn;
                points.push(new THREE.Vector3(Math.cos(aa) * rr, startY - t * len, Math.sin(aa) * rr));
            }
            const curve = new THREE.CatmullRomCurve3(points);
            const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, MOBILE_RENDER_BUDGET ? 24 : 36, 0.038, 8, false), vineStemMat);
            tube.receiveShadow = true;
            vegGroup.add(tube);
        }

        // Variant 3: Twisted Tendrils (Short curly tendrils clinging in damp crevices)
        const tendrilCount = MOBILE_RENDER_BUDGET ? 6 : 10;
        for (let i = 0; i < tendrilCount; i++) {
            const a = envRand() * Math.PI * 2;
            const startY = 4 + envRand() * (WELL_HEIGHT * 0.5 - 4);
            const points = [];
            for (let p = 0; p < 5; p++) {
                const t = p / 4;
                const curl = Math.sin(t * Math.PI * 3.0) * 0.14;
                const aa = a + curl * 0.04;
                const rr = WELL_RADIUS - 0.10;
                points.push(new THREE.Vector3(Math.cos(aa) * rr, startY + curl - t * 3.2, Math.sin(aa) * rr));
            }
            const curve = new THREE.CatmullRomCurve3(points);
            const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.022, 6, false), vineStemMat);
            vegGroup.add(tube);
        }

        // 4. ANCIENT GNARLED ROOTS (Snaking down from well rim)
        const rootMat = vineStemMat;
        const rootTipMat = new THREE.MeshStandardMaterial({ color: 0x24160f, roughness: 1.0 });
        const rootCount = MOBILE_RENDER_BUDGET ? 5 : 8;
        for (let i = 0; i < rootCount; i++) {
            const a = envRand() * Math.PI * 2;
            const startY = WELL_HEIGHT + 1.2 + envRand() * 2.0;
            const len = 10 + envRand() * 18;
            const points = [];
            for (let p = 0; p < 7; p++) {
                const t = p / 6;
                const bend = Math.sin(t * Math.PI * 1.5 + i * 0.8) * (0.06 + t * 0.12);
                const aa = a + bend;
                const rr = WELL_RADIUS - 0.10 - Math.sin(t * Math.PI) * (0.04 + envRand() * 0.04);
                points.push(new THREE.Vector3(Math.cos(aa) * rr, startY - t * len, Math.sin(aa) * rr));
            }
            const curve = new THREE.CatmullRomCurve3(points);
            const radius = (0.08 + envRand() * 0.045);
            const root = new THREE.Mesh(new THREE.TubeGeometry(curve, MOBILE_RENDER_BUDGET ? 16 : 24, radius, 5, false), rootMat);
            root.castShadow = true;
            root.receiveShadow = true;
            vegGroup.add(root);

            const tip = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.85, 6, 5), rootTipMat);
            tip.position.copy(points[points.length - 1]);
            vegGroup.add(tip);
        }

        // 5. FALLEN LEAVES FLOATING ON GROUNDWATER (shared alpha-cutout material)
        const lilyPadGeo = new THREE.PlaneGeometry(0.58, 0.64, 2, 2);
        const lilyPadMat = fernMatA.clone();
        lilyPadMat.roughness = 0.72;
        const lilyCount = MOBILE_RENDER_BUDGET ? 14 : 22;
        const lilyPadMesh = new THREE.InstancedMesh(lilyPadGeo, lilyPadMat, lilyCount);

        for (let i = 0; i < lilyCount; i++) {
            const a = envRand() * Math.PI * 2;
            const rr = 1.6 + Math.sqrt(envRand()) * (WELL_RADIUS - 2.4); // avoid coconut center
            const lx = Math.cos(a) * rr;
            const lz = Math.sin(a) * rr;
            vegDummy.position.set(lx, 0.228, lz);
            vegDummy.rotation.set(-Math.PI / 2, 0, envRand() * Math.PI * 2);
            const sc = 0.55 + envRand() * 0.95;
            vegDummy.scale.set(sc, sc, sc);
            vegDummy.updateMatrix();
            lilyPadMesh.setMatrixAt(i, vegDummy.matrix);
        }
        lilyPadMesh.instanceMatrix.needsUpdate = true;
        lilyPadMesh.receiveShadow = true;
        vegGroup.add(lilyPadMesh);

        // A pale sky card above the opening keeps the top bright while the shaft remains dark.
        const skyDisc = new THREE.Mesh(
            new THREE.CircleGeometry(28, 48),
            new THREE.MeshBasicMaterial({ color: 0xc7ddc0, side: THREE.DoubleSide, fog: false })
        );
        skyDisc.rotation.x = Math.PI / 2;
        skyDisc.position.y = WELL_HEIGHT + 10.5;
        envRoot.add(skyDisc);

        const skyGlow = new THREE.Mesh(
            new THREE.CircleGeometry(11, 40),
            new THREE.MeshBasicMaterial({ color: 0xffefc2, transparent: true, opacity: 0.22, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
        );
        skyGlow.rotation.x = Math.PI / 2;
        skyGlow.position.set(1.8, WELL_HEIGHT + 10.15, -0.8);
        envRoot.add(skyGlow);

        // STEP 5: 3D STONE DETAILS & SILHOUETTE GEOMETRY (Rim Stones, Protruding Wall Stones & Corbels)
        // -----------------------------------------------------------------------------------------
        const stoneDetailGroup = new THREE.Group();
        envRoot.add(stoneDetailGroup);

        // 1. Irregular stone crown around the mouth of the well (Coping Stones)
        const rimStoneGeo = new THREE.DodecahedronGeometry(0.72, 1);
        const rimStoneMat = new THREE.MeshStandardMaterial({ map: rockMap, normalMap: rockNormalMap, normalScale: new THREE.Vector2(0.45, 0.45), roughnessMap: rockRoughnessMap, roughness: 0.94, metalness: 0.0 });
        const rimStoneCount = MOBILE_RENDER_BUDGET ? 24 : 34;
        const rimStones = new THREE.InstancedMesh(rimStoneGeo, rimStoneMat, rimStoneCount);
        const rimDummy = new THREE.Object3D();
        for (let i = 0; i < rimStoneCount; i++) {
            const a = (i / rimStoneCount) * Math.PI * 2 + (envRand() - .5) * 0.06;
            const rr = WELL_RADIUS + 0.18 + (envRand() - .5) * 0.18;
            rimDummy.position.set(Math.cos(a) * rr, WELL_HEIGHT + 0.23 + envRand() * 0.18, Math.sin(a) * rr);
            rimDummy.rotation.set(envRand()*0.55, -a + envRand()*0.25, envRand()*0.45);
            rimDummy.scale.set(0.95 + envRand()*0.45, 0.55 + envRand()*0.35, 0.68 + envRand()*0.38);
            rimDummy.updateMatrix();
            rimStones.setMatrixAt(i, rimDummy.matrix);
        }
        rimStones.instanceMatrix.needsUpdate = true;
        rimStones.castShadow = true;
        rimStones.receiveShadow = true;
        stoneDetailGroup.add(rimStones);

        // 2. Protruding Masonry Wall Stones (Physical blocks breaking the flat cylinder silhouette inside the shaft)
        const wallStoneGeo = new THREE.DodecahedronGeometry(0.42, 1);
        const wallStoneMat = rimStoneMat;
        const wallStoneCount = MOBILE_RENDER_BUDGET ? 28 : 42;
        const wallStones = new THREE.InstancedMesh(wallStoneGeo, wallStoneMat, wallStoneCount);
        const wallStoneDummy = new THREE.Object3D();
        for (let i = 0; i < wallStoneCount; i++) {
            const a = (i / wallStoneCount) * Math.PI * 2 + (envRand() - 0.5) * 0.45;
            const y = 3.2 + (i / wallStoneCount) * (WELL_HEIGHT - 8.0) + (envRand() - 0.5) * 1.6;
            const rr = WELL_RADIUS - 0.14 + (envRand() - 0.5) * 0.16;
            wallStoneDummy.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr);
            wallStoneDummy.rotation.set(envRand() * 0.5, -a + (envRand() - 0.5) * 0.4, envRand() * 0.5);
            wallStoneDummy.scale.set(1.1 + envRand() * 0.6, 0.6 + envRand() * 0.4, 0.8 + envRand() * 0.5);
            wallStoneDummy.updateMatrix();
            wallStones.setMatrixAt(i, wallStoneDummy.matrix);
        }
        wallStones.instanceMatrix.needsUpdate = true;
        wallStones.castShadow = true;
        wallStones.receiveShadow = true;
        stoneDetailGroup.add(wallStones);

        // Textured canopy leaves around the opening; keep the center clear for the exit.
        const canopyGeo = vineLeafGeo;
        const canopyMat = vineLeafMat;
        const canopyCount = MOBILE_RENDER_BUDGET ? 46 : 82;
        const canopy = new THREE.InstancedMesh(canopyGeo, canopyMat, canopyCount);
        const canopyDummy = new THREE.Object3D();
        for (let i = 0; i < canopyCount; i++) {
            const a = envRand() * Math.PI * 2;
            const rr = WELL_RADIUS + 2.0 + envRand() * 7.5;
            canopyDummy.position.set(Math.cos(a) * rr, WELL_HEIGHT + 1.0 + envRand() * 4.2, Math.sin(a) * rr);
            canopyDummy.rotation.set(envRand()*Math.PI, envRand()*Math.PI, envRand()*Math.PI);
            canopyDummy.scale.set(1.0 + envRand()*1.9, 0.45 + envRand()*0.9, 0.8 + envRand()*1.5);
            canopyDummy.updateMatrix();
            canopy.setMatrixAt(i, canopyDummy.matrix);
        }
        canopy.instanceMatrix.needsUpdate = true;
        envRoot.add(canopy);

        // Grassy world outside the well becomes visible near the final climb
        const outerGroundMat = new THREE.MeshStandardMaterial({ color: 0x2c4c2b, roughness: 0.98, side: THREE.DoubleSide });
        const outerGround = new THREE.Mesh(new THREE.RingGeometry(WELL_RADIUS + 0.55, 22, 48), outerGroundMat);
        outerGround.rotation.x = -Math.PI / 2;
        outerGround.position.y = WELL_HEIGHT + 0.02;
        outerGround.receiveShadow = true;
        envRoot.add(outerGround);

        // Cheap low-poly grass tufts around the rim
        const grassBladeMat = new THREE.MeshStandardMaterial({ color: 0x456c35, roughness: 1.0, side: THREE.DoubleSide });
        const grassBladeGeo = new THREE.ConeGeometry(0.08, 0.48, 3);
        for (let i = 0; i < 54; i++) {
            const a = envRand() * Math.PI * 2;
            const r = WELL_RADIUS + 0.75 + envRand() * 4.4;
            const tuft = new THREE.Mesh(grassBladeGeo, grassBladeMat);
            tuft.position.set(Math.cos(a) * r, WELL_HEIGHT + 0.25, Math.sin(a) * r);
            tuft.rotation.z = (envRand() - 0.5) * 0.35;
            tuft.rotation.y = a + envRand();
            tuft.scale.setScalar(0.7 + envRand() * 1.25);
            envRoot.add(tuft);
        }

        // STEP 3: SEMI-REALISTIC GROUNDWATER (2-Layer Scrolling PBR Normals + Dynamic Splash Ripples)
        // -----------------------------------------------------------------------------------------
        function generateWaterNormalTexture(size, isCapillary) {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext('2d');
            const imgData = ctx.createImageData(size, size);
            const data = imgData.data;

            for (let y = 0; y < size; y++) {
                const v = (y / size) * Math.PI * 2;
                for (let x = 0; x < size; x++) {
                    const u = (x / size) * Math.PI * 2;
                    let dx, dy;
                    if (!isCapillary) {
                        // Layer 1: Broad rolling swells & gentle water current
                        dx = Math.cos(u * 2 + v) * 0.45 + Math.cos(u * 3 - v * 2) * 0.35 + Math.sin(u * 4 + v * 3) * 0.20;
                        dy = Math.sin(u + v * 2) * 0.45 - Math.sin(u * 2 - v * 3) * 0.35 + Math.cos(u * 3 + v * 4) * 0.20;
                    } else {
                        // Layer 2: Fine capillary ripples & micro-surface agitation
                        dx = Math.cos(u * 5 - v * 4) * 0.50 + Math.sin(u * 8 + v * 6) * 0.35 + Math.cos(u * 11) * 0.25;
                        dy = -Math.sin(u * 4 + v * 5) * 0.50 + Math.cos(u * 6 - v * 8) * 0.35 + Math.sin(v * 11) * 0.25;
                    }
                    const strength = isCapillary ? 1.4 : 1.1;
                    const len = Math.hypot(dx * strength, dy * strength, 1.0);
                    const idx = (y * size + x) * 4;
                    data[idx]     = Math.floor(((-dx * strength / len) * 0.5 + 0.5) * 255);
                    data[idx + 1] = Math.floor(((-dy * strength / len) * 0.5 + 0.5) * 255);
                    data[idx + 2] = Math.floor(((1.0 / len) * 0.5 + 0.5) * 255);
                    data[idx + 3] = 255;
                }
            }
            ctx.putImageData(imgData, 0, 0);

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(isCapillary ? 8 : 4, isCapillary ? 8 : 4);
            return tex;
        }

        const waterNormal1 = generateWaterNormalTexture(256, false);
        const waterNormal2 = generateWaterNormalTexture(256, true);

        // Murky shallow silt waterbed
        const waterBed = new THREE.Mesh(
            new THREE.CircleGeometry(WELL_RADIUS - 0.08, 44),
            new THREE.MeshStandardMaterial({ color: 0x051510, roughness: 1.0 })
        );
        waterBed.rotation.x = -Math.PI / 2;
        waterBed.position.y = 0.055;
        scene.add(waterBed);

        // Layer 1: Semi-Realistic PBR groundwater with deep cyan/blue depth
        const waterGeo = new THREE.CircleGeometry(WELL_RADIUS - 0.05, 52);
        const waterMat = new THREE.MeshPhysicalMaterial({
            color: 0x073931,
            roughness: 0.16,
            metalness: 0.03,
            clearcoat: 0.88,
            clearcoatRoughness: 0.12,
            normalMap: waterNormal1,
            normalScale: new THREE.Vector2(0.60, 0.60),
            transparent: true,
            opacity: 0.84,
            emissive: 0x021611,
            emissiveIntensity: 0.22
        });
        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.rotation.x = -Math.PI / 2;
        waterMesh.position.y = 0.20;
        waterMesh.receiveShadow = true;
        scene.add(waterMesh);

        // Layer 2: Translucent micro-ripple surface sheen
        const waterSheenMat = new THREE.MeshPhysicalMaterial({
            color: 0x126558,
            roughness: 0.22,
            metalness: 0.0,
            clearcoat: 0.70,
            clearcoatRoughness: 0.16,
            normalMap: waterNormal2,
            normalScale: new THREE.Vector2(0.40, 0.40),
            transparent: true,
            opacity: 0.36,
            depthWrite: false
        });
        const waterSheenMesh = new THREE.Mesh(waterGeo, waterSheenMat);
        waterSheenMesh.rotation.x = -Math.PI / 2;
        waterSheenMesh.position.y = 0.212;
        scene.add(waterSheenMesh);

        // Floating duckweed / algae patches sell the stagnant old-well look.
        const algaeGeo = new THREE.PlaneGeometry(0.22, 0.24);
        const algaeMat = fernMatB;
        const algaeCount = MOBILE_RENDER_BUDGET ? 20 : 34;
        const algae = new THREE.InstancedMesh(algaeGeo, algaeMat, algaeCount);
        const algaeDummy = new THREE.Object3D();
        for (let i = 0; i < algaeCount; i++) {
            const a = envRand() * Math.PI * 2;
            const rr = Math.sqrt(envRand()) * (WELL_RADIUS - 0.7);
            algaeDummy.position.set(Math.cos(a)*rr, 0.228 + envRand()*0.008, Math.sin(a)*rr);
            algaeDummy.rotation.set(-Math.PI/2, 0, envRand()*Math.PI);
            const sc = 0.45 + envRand()*1.75;
            algaeDummy.scale.set(sc * (0.65 + envRand()*0.7), sc, 1);
            algaeDummy.updateMatrix();
            algae.setMatrixAt(i, algaeDummy.matrix);
        }
        algae.instanceMatrix.needsUpdate = true;
        scene.add(algae);

        // Wet stones around the waterline frame the coconut without changing collision.
        const bottomRockGeo = new THREE.DodecahedronGeometry(0.34, 1);
        const bottomRockMat = rimStoneMat.clone();
        bottomRockMat.roughness = 0.58;
        const bottomRockCount = MOBILE_RENDER_BUDGET ? 15 : 25;
        const bottomRocks = new THREE.InstancedMesh(bottomRockGeo, bottomRockMat, bottomRockCount);
        const bottomRockDummy = new THREE.Object3D();
        for (let i = 0; i < bottomRockCount; i++) {
            const a = envRand() * Math.PI * 2;
            const rr = WELL_RADIUS - 0.62 - envRand() * 0.55;
            bottomRockDummy.position.set(Math.cos(a)*rr, 0.24 + envRand()*0.16, Math.sin(a)*rr);
            bottomRockDummy.rotation.set(envRand()*1.2, envRand()*Math.PI, envRand()*1.2);
            bottomRockDummy.scale.set(0.75 + envRand()*1.7, 0.45 + envRand()*0.8, 0.7 + envRand()*1.5);
            bottomRockDummy.updateMatrix();
            bottomRocks.setMatrixAt(i, bottomRockDummy.matrix);
        }
        bottomRocks.instanceMatrix.needsUpdate = true;
        bottomRocks.castShadow = true;
        bottomRocks.receiveShadow = true;
        scene.add(bottomRocks);

        // Ambient gentle ripple rings around the coconut
        const rippleGroup = new THREE.Group();
        const rippleMatTemplate = new THREE.MeshBasicMaterial({
            color: 0x72d6bc,
            transparent: true,
            opacity: 0.20,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const waterRipples = [];
        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.63, 32), rippleMatTemplate.clone());
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.225 + i * 0.003;
            ring.userData.phase = i / 3;
            rippleGroup.add(ring);
            waterRipples.push(ring);
        }
        scene.add(rippleGroup);

        // Dynamic splash ripple ring pool (triggered on frog water impact)
        const splashRingGeo = new THREE.RingGeometry(0.20, 0.34, 36);
        const splashRingMatTemplate = new THREE.MeshBasicMaterial({
            color: 0x8ef0d5,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const splashPool = [];
        const splashPoolSize = 6;
        for (let i = 0; i < splashPoolSize; i++) {
            const mesh = new THREE.Mesh(splashRingGeo, splashRingMatTemplate.clone());
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 0.226;
            mesh.visible = false;
            scene.add(mesh);
            splashPool.push({
                mesh: mesh,
                active: false,
                startTime: 0,
                delay: 0,
                duration: 1.35,
                maxScale: 6.0
            });
        }

        // Dynamic splash droplets (leaping water particles)
        const splashDropCount = 18;
        const splashDropGeo = new THREE.BufferGeometry();
        const splashDropPos = new Float32Array(splashDropCount * 3);
        const splashDropVel = [];
        for (let i = 0; i < splashDropCount; i++) {
            splashDropPos[i * 3 + 1] = -100;
            splashDropVel.push({ x: 0, y: 0, z: 0, life: 0 });
        }
        splashDropGeo.setAttribute('position', new THREE.BufferAttribute(splashDropPos, 3));
        const splashDropMat = new THREE.PointsMaterial({
            color: 0xb5ffea,
            size: 0.085,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const splashDrops = new THREE.Points(splashDropGeo, splashDropMat);
        scene.add(splashDrops);

        function triggerWaterSplash(x, z, intensity = 1.0) {
            const now = performance.now();
            let ringsFired = 0;
            for (let item of splashPool) {
                if (!item.active && ringsFired < 2) {
                    item.active = true;
                    item.startTime = now;
                    item.delay = ringsFired * 150;
                    item.maxScale = (3.6 + ringsFired * 2.4) * Math.min(1.6, intensity);
                    item.mesh.position.set(x, 0.224 + ringsFired * 0.002, z);
                    item.mesh.scale.set(0.4, 0.4, 0.4);
                    item.mesh.material.opacity = 0.58 / (1 + ringsFired * 0.4);
                    item.mesh.visible = true;
                    ringsFired++;
                }
            }

            const dropCount = Math.floor(8 + Math.min(10, intensity * 6));
            const posArray = splashDropGeo.attributes.position.array;
            for (let i = 0; i < dropCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.7 + Math.random() * 1.6 * Math.min(1.6, intensity);
                splashDropVel[i].x = Math.cos(angle) * speed;
                splashDropVel[i].y = 1.5 + Math.random() * 2.2 * Math.min(1.6, intensity);
                splashDropVel[i].z = Math.sin(angle) * speed;
                splashDropVel[i].life = 0.55 + Math.random() * 0.35;
                posArray[i * 3]     = x + (Math.random() - 0.5) * 0.22;
                posArray[i * 3 + 1] = 0.25;
                posArray[i * 3 + 2] = z + (Math.random() - 0.5) * 0.22;
            }
            splashDropGeo.attributes.position.needsUpdate = true;
        }

        // Fine airborne moisture catches the shaft light without expensive volumetrics
        const mistCount = MOBILE_RENDER_BUDGET ? 72 : 120;
        const mistGeo = new THREE.BufferGeometry();
        const mistPositions = new Float32Array(mistCount * 3);
        const mistBaseY = new Float32Array(mistCount);
        for (let i = 0; i < mistCount; i++) {
            const rad = Math.sqrt(envRand()) * (WELL_RADIUS - 0.55);
            const ang = envRand() * Math.PI * 2;
            mistPositions[i * 3] = Math.cos(ang) * rad;
            mistBaseY[i] = 4 + envRand() * (WELL_HEIGHT - 5);
            mistPositions[i * 3 + 1] = mistBaseY[i];
            mistPositions[i * 3 + 2] = Math.sin(ang) * rad;
        }
        mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
        const mistMat = new THREE.PointsMaterial({ color: 0xd8f0df, size: 0.055, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending });
        const mist = new THREE.Points(mistGeo, mistMat);
        scene.add(mist);

        // Volumetric God Rays with soft vertical gradient falloff and golden sun motes
        function applyShaftGradient(geo, topR, topG, topB, power = 1.85) {
            const pos = geo.attributes.position;
            const colors = new Float32Array(pos.count * 3);
            let minY = Infinity, maxY = -Infinity;
            for (let i = 0; i < pos.count; i++) {
                const y = pos.getY(i);
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
            const rangeY = (maxY - minY) || 1;
            for (let i = 0; i < pos.count; i++) {
                const y = pos.getY(i);
                const t = Math.max(0, Math.min(1, (y - minY) / rangeY));
                const factor = Math.pow(t, power);
                colors[i * 3]     = topR * factor;
                colors[i * 3 + 1] = topG * factor;
                colors[i * 3 + 2] = topB * factor;
            }
            geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        }

        const godRayGroup = new THREE.Group();

        // 1. Outer volumetric cone (broad soft light envelope)
        const rayGeo = new THREE.CylinderGeometry(WELL_RADIUS * 0.62, WELL_RADIUS * 0.96, WELL_HEIGHT * 0.70, 24, 8, true);
        applyShaftGradient(rayGeo, 0.98, 0.91, 0.72, 1.85);
        const rayMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            color: 0xffffff,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const godRay = new THREE.Mesh(rayGeo, rayMat);
        godRay.position.set(0.5, WELL_HEIGHT - (WELL_HEIGHT * 0.33), 0.3);
        godRayGroup.add(godRay);

        // 2. Inner core beam (focused, brighter sunbeam)
        const rayGeoInner = new THREE.CylinderGeometry(WELL_RADIUS * 0.28, WELL_RADIUS * 0.58, WELL_HEIGHT * 0.56, 16, 8, true);
        applyShaftGradient(rayGeoInner, 1.0, 0.96, 0.82, 2.2);
        const rayMatInner = new THREE.MeshBasicMaterial({
            vertexColors: true,
            color: 0xffffff,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const innerRay = new THREE.Mesh(rayGeoInner, rayMatInner);
        innerRay.position.set(1.0, WELL_HEIGHT * 0.74, -0.6);
        innerRay.rotation.z = -0.04;
        godRayGroup.add(innerRay);

        // 3. Angled side beam
        const rayGeoSide = new THREE.CylinderGeometry(WELL_RADIUS * 0.16, WELL_RADIUS * 0.40, WELL_HEIGHT * 0.48, 14, 8, true);
        applyShaftGradient(rayGeoSide, 0.94, 0.88, 0.68, 2.0);
        const rayMatSide = new THREE.MeshBasicMaterial({
            vertexColors: true,
            color: 0xffffff,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const sideRay = new THREE.Mesh(rayGeoSide, rayMatSide);
        sideRay.position.set(-1.4, WELL_HEIGHT * 0.77, 0.9);
        sideRay.rotation.z = 0.06;
        godRayGroup.add(sideRay);

        // 4. Golden sun motes catching the beam inside the upper shaft (Y: 32..64)
        const moteCount = MOBILE_RENDER_BUDGET ? 24 : 40;
        const moteGeo = new THREE.BufferGeometry();
        const motePositions = new Float32Array(moteCount * 3);
        const moteBaseY = new Float32Array(moteCount);
        const moteSpeed = new Float32Array(moteCount);
        for (let i = 0; i < moteCount; i++) {
            const rad = Math.sqrt(envRand()) * (WELL_RADIUS * 0.55);
            const ang = envRand() * Math.PI * 2;
            motePositions[i * 3]     = Math.cos(ang) * rad + 0.5;
            moteBaseY[i]             = 32 + envRand() * 31;
            motePositions[i * 3 + 1] = moteBaseY[i];
            motePositions[i * 3 + 2] = Math.sin(ang) * rad + 0.3;
            moteSpeed[i]             = 0.4 + envRand() * 0.8;
        }
        moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
        const moteMat = new THREE.PointsMaterial({
            color: 0xffeaad,
            size: MOBILE_RENDER_BUDGET ? 0.08 : 0.10,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const sunMotes = new THREE.Points(moteGeo, moteMat);
        godRayGroup.add(sunMotes);

        scene.add(godRayGroup);

        // Moss-dark stone rim instead of a bright toy-like green ring.
        // Individual rim stones above provide the irregular silhouette from the reference image.

        // Green grassy rim at the top of the well
        const rimGeo = new THREE.TorusGeometry(WELL_RADIUS + 0.3, 0.7, 12, 36);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0x344a39, roughness: 0.93, metalness: 0.0 });
        const rimMesh = new THREE.Mesh(rimGeo, rimMat);
        rimMesh.rotation.x = Math.PI / 2;
        rimMesh.position.y = WELL_HEIGHT;
        scene.add(rimMesh);

        // Ambient floating fireflies
        const fireflyCount = MOBILE_RENDER_BUDGET ? 44 : 72;
        const fireflyGeo = new THREE.BufferGeometry();
        const fireflyPositions = new Float32Array(fireflyCount * 3);
        const fireflyBaseY = new Float32Array(fireflyCount);
        for (let i = 0; i < fireflyCount; i++) {
            const rad = envRand() * (WELL_RADIUS - 1.2);
            const ang = envRand() * Math.PI * 2;
            fireflyPositions[i * 3] = Math.cos(ang) * rad;
            fireflyBaseY[i] = envRand() * (WELL_HEIGHT - 2) + 1;
            fireflyPositions[i * 3 + 1] = fireflyBaseY[i];
            fireflyPositions[i * 3 + 2] = Math.sin(ang) * rad;
        }
        fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
        const fireflyMat = new THREE.PointsMaterial({
            color: 0x93f5b0,
            size: 0.28,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending
        });
        const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
        scene.add(fireflies);

        // Platforms setup
        const platforms = [];
        platforms.push({
            pos: new THREE.Vector3(0, 0.45, 0),
            radius: 1.45,
            height: 0.5,
            isCoconut: true
        });

        const totalSteps = Math.ceil((WELL_HEIGHT - 5) / 2.25);
        let currentAngle = 0.35;

        const steppingStoneMaterials = [0xb9a080, 0x899087, 0x666d69, 0xb8bab4].map(color => new THREE.MeshStandardMaterial({
            map: rockMap,
            normalMap: rockNormalMap,
            normalScale: new THREE.Vector2(0.55, 0.55),
            roughnessMap: rockRoughnessMap,
            color,
            roughness: 0.92,
            metalness: 0.0
        }));

        const stoneBevel = 0.14;
        function createSteppingStoneGeometry(outline, height) {
            const shape = new THREE.Shape();
            shape.moveTo(...outline[0]);
            outline.slice(1).forEach(point => shape.lineTo(...point));
            shape.closePath();
            return new THREE.ExtrudeGeometry(shape, {
                depth: height - stoneBevel * 2, steps: 1,
                bevelEnabled: true, bevelThickness: stoneBevel,
                bevelSize: stoneBevel, bevelSegments: 3
            }).rotateX(Math.PI / 2).translate(0, height / 2 - stoneBevel, 0);
        }

        for (let i = 1; i <= totalSteps + 1; i++) {
            const isFinish = i === totalSteps + 1;
            const progress = i / totalSteps;
            const y = isFinish ? WELL_HEIGHT - 0.22 : 2.4 + progress * (WELL_HEIGHT - 5.0);
            const dist = WELL_RADIUS - 1.8 - (Math.sin(i * 1.5) * 0.3);
            currentAngle += 1.35;

            const x = Math.cos(currentAngle) * dist;
            const z = Math.sin(currentAngle) * dist;
            const normAngle = Math.atan2(z, x);

            const pGroup = new THREE.Group();
            pGroup.position.set(x, y, z);
            // The back of each natural rock remains embedded in the circular wall.
            pGroup.rotation.y = -normAngle + Math.PI / 2;

            const rad = isFinish ? 1.5 : 1.35 - (progress * 0.22);
            const brickWidth = rad * 2.15;
            const brickHeight = 0.85 + Math.sin(i * 2.1) * 0.15;
            const frontDepth = rad * 1.65 / 2;
            const backDepth = WELL_RADIUS - dist + 0.45;
            const brickDepth = frontDepth + backDepth;
            const brickOffsetZ = (backDepth - frontDepth) / 2;
            const brickOffsetY = (0.44 - brickHeight) / 2; // Preserve the existing jump landing height.

            // Asymmetric clipped outlines, with a flat cap for reliable footing.
            const outline = [[-0.48, -0.28], [-0.28, -0.50], [0.25, -0.47], [0.49, -0.26],
                [0.46, 0.28], [0.25, 0.50], [-0.30, 0.48], [-0.50, 0.18]].map(([sx, sz], corner) => [
                (sx + Math.sin(i * 3.7 + corner * 2.3) * 0.045) * brickWidth,
                (sz + Math.cos(i * 2.9 + corner * 1.7) * 0.035) * brickDepth
            ]);
            const mainBrickGeo = createSteppingStoneGeometry(outline, brickHeight);
            const mainBrickMesh = new THREE.Mesh(mainBrickGeo, steppingStoneMaterials[(i - 1) % steppingStoneMaterials.length]);
            mainBrickMesh.position.set(0, brickOffsetY, brickOffsetZ);
            mainBrickMesh.castShadow = true;
            mainBrickMesh.receiveShadow = true;
            pGroup.add(mainBrickMesh);
            if (isFinish) {
                const finishRing = new THREE.Mesh(
                    new THREE.RingGeometry(0.72, 0.92, 48),
                    new THREE.MeshBasicMaterial({ color: 0xffd43b, side: THREE.DoubleSide, toneMapped: false, transparent: true, depthWrite: false })
                );
                finishRing.rotation.x = -Math.PI / 2;
                finishRing.position.set(0, 0.25, brickOffsetZ);
                finishRing.renderOrder = 10;
                pGroup.add(finishRing);
                const finishPad = new THREE.Mesh(
                    new THREE.CircleGeometry(0.72, 48),
                    new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, toneMapped: false, transparent: true, depthWrite: false })
                );
                finishPad.rotation.x = -Math.PI / 2;
                finishPad.position.copy(finishRing.position);
                finishPad.renderOrder = 10;
                pGroup.add(finishPad);
            }

            scene.add(pGroup);

            platforms.push({
                pos: new THREE.Vector3(x + Math.cos(normAngle) * brickOffsetZ, y + brickOffsetY, z + Math.sin(normAngle) * brickOffsetZ),
                angle: normAngle,
                outline,
                height: brickHeight,
                isTopExit: isFinish,
                finishRadius: isFinish ? 0.92 : 0
            });
        }

        // The Coconut Shell (Spawn Platform at bottom)
        const coconutGroup = new THREE.Group();
        const shellMat = new THREE.MeshStandardMaterial({
            map: generateCoconutTexture(),
            roughness: 0.9,
            side: THREE.DoubleSide
        });
        const shellGeo = new THREE.SphereGeometry(1.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.7);
        const shellMesh = new THREE.Mesh(shellGeo, shellMat);
        shellMesh.rotation.x = Math.PI;
        shellMesh.position.y = 1.0;
        shellMesh.castShadow = true;
        shellMesh.receiveShadow = true;
        coconutGroup.add(shellMesh);

        // Coconut White Pulp Layer
        const pulpGeo = new THREE.SphereGeometry(1.52, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.75);
        const pulpMat = new THREE.MeshStandardMaterial({ color: 0xf3ede2, roughness: 0.5, side: THREE.DoubleSide });
        const pulpMesh = new THREE.Mesh(pulpGeo, pulpMat);
        pulpMesh.rotation.x = Math.PI;
        pulpMesh.position.y = 0.98;
        coconutGroup.add(pulpMesh);
        scene.add(coconutGroup);

        /*
           Constructing the Crouched Voxel Sitting Frog exactly matching image (27763.jpg):
           - Authentic frog sitting crouch posture with front feet on ground and bent hind legs hugging the flanks
           - Crisp black cel-shaded voxel outlines (EdgesGeometry) matching the cartoon aesthetic
           - Square eyes atop head with square black pupils and specular catchlights
           - Prominent bright yellow lower jaw bar and angled yellow chest/belly plate
           - Dynamic leg animation: crouches to compress for jump, extends legs in mid-air leap, and lands into crouch
        */
        const frog = new THREE.Group();
        const frogAnimRoot = new THREE.Group();
        frog.add(frogAnimRoot);

        function createLowPolyMesh(geo, mat) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        }

        // Low-Poly Frog Palette matching reference image
        const frogGreenMat = new THREE.MeshStandardMaterial({
            color: 0x72b938, // Vibrant leaf lime green
            roughness: 0.82,
            metalness: 0.0,
            flatShading: true
        });

        const frogDarkGreenMat = new THREE.MeshStandardMaterial({
            color: 0x4f8728, // Nostrils and accent creases
            roughness: 0.88,
            metalness: 0.0,
            flatShading: true
        });

        const frogCreamMat = new THREE.MeshStandardMaterial({
            color: 0xdcd59b, // Warm ivory cream chin and belly
            roughness: 0.86,
            metalness: 0.0,
            flatShading: true
        });

        const eyeWhiteMat = new THREE.MeshStandardMaterial({
            color: 0xfbfaf4,
            roughness: 0.60,
            metalness: 0.0,
            flatShading: true
        });

        const eyePupilMat = new THREE.MeshStandardMaterial({
            color: 0x241a18,
            roughness: 0.45,
            metalness: 0.0,
            flatShading: true
        });

        const eyeGlintMat = new THREE.MeshBasicMaterial({
            color: 0xffffff
        });

        // 1. Torso & Cream Belly Group
        const torsoGroup = new THREE.Group();

        // Main green low-poly torso (hunched forward in alert resting posture)
        const mainBodyGeo = new THREE.DodecahedronGeometry(0.38, 1);
        mainBodyGeo.scale(1.15, 0.95, 1.10);
        const mainBody = createLowPolyMesh(mainBodyGeo, frogGreenMat);
        mainBody.position.set(0, 0.28, -0.06);
        mainBody.rotation.x = 0.16;
        torsoGroup.add(mainBody);

        // Hunched back spine ridge
        const hunchedBackGeo = new THREE.DodecahedronGeometry(0.28, 0);
        hunchedBackGeo.scale(1.0, 0.85, 1.25);
        const hunchedBack = createLowPolyMesh(hunchedBackGeo, frogGreenMat);
        hunchedBack.position.set(0, 0.38, -0.16);
        torsoGroup.add(hunchedBack);

        // Warm Cream Belly / Chest (Pulsing throat/belly group)
        const bellyGroup = new THREE.Group();
        const bellyPlateGeo = new THREE.DodecahedronGeometry(0.30, 1);
        bellyPlateGeo.scale(0.92, 1.12, 0.72);
        const bellyPlate = createLowPolyMesh(bellyPlateGeo, frogCreamMat);
        bellyPlate.position.set(0, 0.26, 0.16);
        bellyPlate.rotation.x = -0.14;
        bellyGroup.add(bellyPlate);
        torsoGroup.add(bellyGroup);

        frogAnimRoot.add(torsoGroup);

        // 2. Head Group
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.44, 0.08);

        // Upper green head dome
        const headUpperGeo = new THREE.DodecahedronGeometry(0.32, 1);
        headUpperGeo.scale(1.35, 0.82, 1.05);
        const headUpper = createLowPolyMesh(headUpperGeo, frogGreenMat);
        headUpper.position.set(0, 0.10, 0.03);
        headGroup.add(headUpper);

        // Smiling Cream Chin / Throat (sweeping under the mouth from cheek to cheek)
        const chinGeo = new THREE.CylinderGeometry(0.38, 0.26, 0.22, 8, 1);
        chinGeo.scale(1.15, 1.0, 0.92);
        const chin = createLowPolyMesh(chinGeo, frogCreamMat);
        chin.position.set(0, -0.05, 0.09);
        chin.rotation.x = -0.10;
        headGroup.add(chin);

        // Nose ridge & cute nostril accents
        const nostrilL = createLowPolyMesh(new THREE.ConeGeometry(0.022, 0.05, 4), frogDarkGreenMat);
        nostrilL.position.set(-0.065, 0.165, 0.26);
        nostrilL.rotation.set(-0.6, 0.3, 0);
        headGroup.add(nostrilL);

        const nostrilR = createLowPolyMesh(new THREE.ConeGeometry(0.022, 0.05, 4), frogDarkGreenMat);
        nostrilR.position.set(0.065, 0.165, 0.26);
        nostrilR.rotation.set(-0.6, -0.3, 0);
        headGroup.add(nostrilR);

        // Big Bulbous Eye Turrets matching reference photo
        function createLowPolyEye(xPos) {
            const eyeGroup = new THREE.Group();
            const sign = xPos < 0 ? -1 : 1;

            // Green faceted dome turret
            const turretGeo = new THREE.IcosahedronGeometry(0.165, 1);
            turretGeo.scale(1.0, 1.15, 0.95);
            const turret = createLowPolyMesh(turretGeo, frogGreenMat);
            turret.position.set(0, 0.08, 0);
            eyeGroup.add(turret);

            // Sclera: faceted white eyeball disc
            const whiteGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.025, 8);
            const eyeWhite = createLowPolyMesh(whiteGeo, eyeWhiteMat);
            eyeWhite.rotation.x = Math.PI / 2;
            eyeWhite.position.set(0, 0.08, 0.125);
            eyeGroup.add(eyeWhite);

            // Large dark pupil
            const pupilGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.025, 8);
            const pupil = createLowPolyMesh(pupilGeo, eyePupilMat);
            pupil.rotation.x = Math.PI / 2;
            pupil.position.set(sign * 0.012, 0.075, 0.138);
            eyeGroup.add(pupil);

            // Chunky white catchlight highlight square at upper-right
            const glintGeo = new THREE.PlaneGeometry(0.038, 0.045);
            const glint = new THREE.Mesh(glintGeo, eyeGlintMat);
            glint.position.set(0.030, 0.105, 0.155);
            eyeGroup.add(glint);

            eyeGroup.position.set(xPos, 0.20, 0.04);
            eyeGroup.rotation.z = sign * -0.20;
            eyeGroup.rotation.x = -0.08;
            return eyeGroup;
        }

        const eyeL = createLowPolyEye(-0.19);
        const eyeR = createLowPolyEye(0.19);
        headGroup.add(eyeL);
        headGroup.add(eyeR);
        frogAnimRoot.add(headGroup);

        // 3. Front Forelimbs with 4 Padded Webbed Toes
        function createFrontForeleg(isLeft) {
            const legGroup = new THREE.Group();
            const sign = isLeft ? -1 : 1;

            // Slender green upper arm
            const armUpperGeo = new THREE.CylinderGeometry(0.055, 0.046, 0.20, 6);
            const armUpper = createLowPolyMesh(armUpperGeo, frogGreenMat);
            armUpper.position.set(0, -0.09, 0);
            armUpper.rotation.z = sign * -0.08;
            legGroup.add(armUpper);

            // Lower forearm
            const armLowerGeo = new THREE.CylinderGeometry(0.046, 0.040, 0.18, 6);
            const armLower = createLowPolyMesh(armLowerGeo, frogGreenMat);
            armLower.position.set(sign * 0.02, -0.24, 0.02);
            armLower.rotation.x = 0.12;
            legGroup.add(armLower);

            // Splayed Foot with 4 distinct toes and chunky hexagonal pads
            const footGroup = new THREE.Group();
            footGroup.position.set(sign * 0.03, -0.32, 0.04);

            const toeAngles = [-0.55, -0.18, 0.18, 0.55];
            const toeLengths = [0.11, 0.14, 0.14, 0.11];

            for (let t = 0; t < 4; t++) {
                const ang = toeAngles[t];
                const len = toeLengths[t];

                // Toe shaft
                const toeGeo = new THREE.BoxGeometry(0.026, 0.026, len);
                const toe = createLowPolyMesh(toeGeo, frogGreenMat);
                const tDist = len * 0.5;
                toe.position.set(Math.sin(ang) * tDist, 0.013, Math.cos(ang) * tDist);
                toe.rotation.y = ang;
                footGroup.add(toe);

                // Chunky hexagonal toe pad at tip
                const padGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.030, 6);
                const pad = createLowPolyMesh(padGeo, frogGreenMat);
                pad.position.set(Math.sin(ang) * len, 0.015, Math.cos(ang) * len);
                footGroup.add(pad);
            }

            legGroup.add(footGroup);
            legGroup.position.set(sign * 0.20, 0.34, 0.20);
            return legGroup;
        }

        const frontLegL = createFrontForeleg(true);
        const frontLegR = createFrontForeleg(false);
        frogAnimRoot.add(frontLegL);
        frogAnimRoot.add(frontLegR);

        // 4. Rear Crouched Hindlegs (Folded muscular thighs & 4-toed splayed feet)
        function createCrouchedHindleg(isLeft) {
            const legGroup = new THREE.Group();
            const sign = isLeft ? -1 : 1;

            // Folded muscular thigh on flank
            const thighGeo = new THREE.DodecahedronGeometry(0.24, 1);
            thighGeo.scale(0.72, 1.05, 1.35);
            const thigh = createLowPolyMesh(thighGeo, frogGreenMat);
            thigh.position.set(sign * 0.03, 0.06, -0.04);
            thigh.rotation.set(-0.10, sign * 0.25, sign * -0.20);
            legGroup.add(thigh);

            // Lower shin folded down against flank
            const shinGeo = new THREE.CylinderGeometry(0.065, 0.042, 0.26, 6);
            const shin = createLowPolyMesh(shinGeo, frogDarkGreenMat);
            shin.position.set(sign * 0.06, -0.10, 0.06);
            shin.rotation.set(0.35, sign * -0.15, sign * 0.10);
            legGroup.add(shin);

            // Wide splayed hind foot resting flat on the ground with 4 padded toes
            const hindFootGroup = new THREE.Group();
            hindFootGroup.position.set(sign * 0.06, -0.22, 0.08);

            const hindToeAngles = [-0.60, -0.20, 0.18, 0.58];
            const hindToeLengths = [0.12, 0.15, 0.15, 0.12];

            for (let t = 0; t < 4; t++) {
                const ang = hindToeAngles[t] + (sign * 0.12);
                const len = hindToeLengths[t];

                // Toe shaft
                const toeGeo = new THREE.BoxGeometry(0.028, 0.028, len);
                const toe = createLowPolyMesh(toeGeo, frogGreenMat);
                const tDist = len * 0.5;
                toe.position.set(Math.sin(ang) * tDist, 0.014, Math.cos(ang) * tDist);
                toe.rotation.y = ang;
                hindFootGroup.add(toe);

                // Chunky hexagonal toe pad
                const padGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.032, 6);
                const pad = createLowPolyMesh(padGeo, frogGreenMat);
                pad.position.set(Math.sin(ang) * len, 0.016, Math.cos(ang) * len);
                hindFootGroup.add(pad);
            }
            legGroup.add(hindFootGroup);

            legGroup.position.set(sign * 0.30, 0.24, -0.06);
            return legGroup;
        }

        const hindLegL = createCrouchedHindleg(true);
        const hindLegR = createCrouchedHindleg(false);
        frogAnimRoot.add(hindLegL);
        frogAnimRoot.add(hindLegR);

        // Direction Indicator Arrow at Frog's feet for clear aiming
        const arrowGroup = new THREE.Group();
        const arrowShaftGeo = new THREE.ConeGeometry(0.22, 0.65, 4);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0x38ef7d, transparent: true, opacity: 0.85 });
        const arrowMesh = new THREE.Mesh(arrowShaftGeo, arrowMat);
        arrowMesh.rotation.x = Math.PI / 2;
        arrowMesh.position.set(0, 0.08, 0.85);
        arrowGroup.add(arrowMesh);
        frog.add(arrowGroup);

        frog.position.set(0, 0.45, 0);
        scene.add(frog);

        const TRAJ_COUNT = 18;
        const trajSpheres = [];
        const trajGroup = new THREE.Group();
        const trajDotGeo = new THREE.SphereGeometry(0.11, 8, 8);
        const trajDotMat = new THREE.MeshBasicMaterial({ color: 0x38ef7d, transparent: true, opacity: 0.85 });

        for (let i = 0; i < TRAJ_COUNT; i++) {
            const dot = new THREE.Mesh(trajDotGeo, trajDotMat.clone());
            const scale = 1.0 - (i / TRAJ_COUNT) * 0.45;
            dot.scale.set(scale, scale, scale);
            dot.visible = false;
            trajSpheres.push(dot);
            trajGroup.add(dot);
        }
        scene.add(trajGroup);

        // Physics & Game States
        const physics = {
            pos: new THREE.Vector3(0, 0.45, 0),
            vel: new THREE.Vector3(0, 0, 0),
            facingAngle: 0,
            onGround: true,
            charging: false,
            chargePower: 0,
            jumpCount: 0,
            reachedWellTop: false,
            dead: false,
            fallPeakY: 0.45
        };

        // Run Timer & Score Tracking
        let gameStartTime = null;
        let runElapsedTime = 0;
        let runMaxAltitude = 0;
        let isRunActive = false;

        function formatGameTime(totalSeconds) {
            const m = Math.floor(totalSeconds / 60);
            const s = (totalSeconds % 60).toFixed(1);
            return `${m.toString().padStart(2, '0')}:${s < 10 ? '0' : ''}${s}`;
        }

        const GRAVITY = 26.0;
        const MAX_JUMP_FORCE = 18.5;
        const MIN_JUMP_FORCE = 6.2;
        const FATAL_FALL_HEIGHT = 20;

        const storyMilestones = {
            firstJump: false,
            quarter: false,
            halfway: false,
            nearTop: false
        };

        // DOM Elements
        const storyBubble = document.getElementById('story-bubble');
        const storyText = document.getElementById('story-text');
        const storyBubbleContainer = document.getElementById('story-bubble-container');
        const btnCloseStory = document.getElementById('btn-close-story');
        const altitudeText = document.getElementById('altitude-text');
        const altitudeProgress = document.getElementById('altitude-progress');
        const chargeContainer = document.getElementById('charge-container');
        const chargeBar = document.getElementById('charge-bar');
        const chargePercent = document.getElementById('charge-percent');

        let storyTimeout = null;

        function closeStory() {
            if (storyBubbleContainer) {
                storyBubbleContainer.classList.add('bubble-hidden');
            }
            if (storyTimeout) {
                clearTimeout(storyTimeout);
                storyTimeout = null;
            }
        }

        function triggerSpeech(msg, autoHideSec = 3.8) {
            storyText.textContent = `"${msg}"`;
            storyBubbleContainer.classList.remove('bubble-hidden');
            storyBubble.classList.remove('bubble-pop');
            void storyBubble.offsetWidth;
            storyBubble.classList.add('bubble-pop');
            frogAudio.playCroak();

            if (storyTimeout) clearTimeout(storyTimeout);
            if (autoHideSec > 0) {
                storyTimeout = setTimeout(() => {
                    closeStory();
                }, autoHideSec * 1000);
            }
        }

        if (btnCloseStory) {
            btnCloseStory.addEventListener('click', (e) => {
                e.stopPropagation();
                closeStory();
            });
        }
        if (storyBubble) {
            storyBubble.addEventListener('click', closeStory);
        }

        // Auto hide intro bubble after 4.5s
        storyTimeout = setTimeout(closeStory, 4500);

        function checkAltitudeTriggers(y) {
            if (!storyMilestones.firstJump && y > 1.8) {
                storyMilestones.firstJump = true;
                triggerSpeech("ว้าววว! นอกกะลามันสว่างขนาดนี้เลยเหรอ!? ...เดี๋ยวนะ นี่มันแค่ก้นบ่อน้ำเองนี่หว่า!?");
            } else if (!storyMilestones.quarter && y > WELL_HEIGHT * 0.25) {
                storyMilestones.quarter = true;
                triggerSpeech("โอ้โห บ่อนี้มันจะลึกไปไหนเนี่ย เริ่มเห็นแสงข้างบนแล้ว!");
            } else if (!storyMilestones.halfway && y > WELL_HEIGHT * 0.5) {
                storyMilestones.halfway = true;
                triggerSpeech("มาได้ครึ่งทางแล้ว! กะลาใบเดิมก้นบ่อเหลืออันจิ๋วเดียวเอง!");
            } else if (!storyMilestones.nearTop && y > WELL_HEIGHT * 0.8) {
                storyMilestones.nearTop = true;
                triggerSpeech("ได้กลิ่นสายลมกับทุ่งหญ้าแล้ว! อีกนิดเดียวกระโดดข้ามขอบบ่อเลย!");
            }
        }

        /*
           Camera Setup:
           Allowing free camera rotation through the wall without restriction,
           while maintaining a clear, cutaway view of the frog at all times.
        */
        let isDraggingCam = false;
        let prevMouseX = 0;
        let prevMouseY = 0;
        let camTheta = 0;
        let camPhi = 0.32;
        let camDistance = 5.8;

        // Desktop mouse drag
        window.addEventListener('mousedown', (e) => {
            if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                isDraggingCam = true;
                prevMouseX = e.clientX;
                prevMouseY = e.clientY;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (isDraggingCam) {
                const dx = e.clientX - prevMouseX;
                const dy = e.clientY - prevMouseY;
                prevMouseX = e.clientX;
                prevMouseY = e.clientY;
                camTheta -= dx * 0.007;
                camPhi = Math.max(0.05, Math.min(1.35, camPhi + dy * 0.006));
            }
        });

        window.addEventListener('mouseup', () => { isDraggingCam = false; });

        // Desktop mouse wheel zoom to inspect PBR wall close-up
        window.addEventListener('wheel', (e) => {
            camDistance = Math.max(2.2, Math.min(14.0, camDistance + e.deltaY * 0.005));
        }, { passive: true });

        // Mobile touch drag to orbit camera freely + 2-finger pinch zoom
        let touchCamStartX = 0;
        let touchCamStartY = 0;
        let isTouchCamActive = false;
        let initialPinchDist = 0;
        let initialPinchCamDist = camDistance;

        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isTouchCamActive = true;
                touchCamStartX = e.touches[0].clientX;
                touchCamStartY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                isTouchCamActive = false;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialPinchDist = Math.hypot(dx, dy);
                initialPinchCamDist = camDistance;
            }
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (isTouchCamActive && e.touches.length === 1) {
                const dx = e.touches[0].clientX - touchCamStartX;
                const dy = e.touches[0].clientY - touchCamStartY;
                touchCamStartX = e.touches[0].clientX;
                touchCamStartY = e.touches[0].clientY;
                camTheta -= dx * 0.008;
                camPhi = Math.max(0.05, Math.min(1.35, camPhi + dy * 0.006));
            } else if (e.touches.length === 2 && initialPinchDist > 0) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const currentDist = Math.hypot(dx, dy);
                const factor = initialPinchDist / Math.max(10, currentDist);
                camDistance = Math.max(2.2, Math.min(14.0, initialPinchCamDist * factor));
            }
        }, { passive: true });

        container.addEventListener('touchend', () => {
            isTouchCamActive = false;
            initialPinchDist = 0;
        });

        // Camera Reset Button (snaps camera directly behind the frog)
        document.getElementById('btn-cam-reset').addEventListener('click', () => {
            camTheta = physics.facingAngle + Math.PI;
            camPhi = 0.32;
            if (navigator.vibrate) navigator.vibrate(20);
        });

        let steerDirection = 0; // -1: right, 1: left
        const btnTurnLeft = document.getElementById('btn-turn-left');
        const btnTurnRight = document.getElementById('btn-turn-right');

        function startTurnLeft(e) {
            if (e) e.preventDefault();
            steerDirection = 1;
            btnTurnLeft.classList.add('bg-emerald-600', 'scale-95');
        }
        function stopTurnLeft() {
            if (steerDirection === 1) steerDirection = 0;
            btnTurnLeft.classList.remove('bg-emerald-600', 'scale-95');
        }

        function startTurnRight(e) {
            if (e) e.preventDefault();
            steerDirection = -1;
            btnTurnRight.classList.add('bg-emerald-600', 'scale-95');
        }
        function stopTurnRight() {
            if (steerDirection === -1) steerDirection = 0;
            btnTurnRight.classList.remove('bg-emerald-600', 'scale-95');
        }

        // Left Turn bindings
        btnTurnLeft.addEventListener('touchstart', startTurnLeft, { passive: false });
        btnTurnLeft.addEventListener('touchend', stopTurnLeft);
        btnTurnLeft.addEventListener('mousedown', startTurnLeft);
        btnTurnLeft.addEventListener('mouseup', stopTurnLeft);
        btnTurnLeft.addEventListener('mouseleave', stopTurnLeft);

        // Right Turn bindings
        btnTurnRight.addEventListener('touchstart', startTurnRight, { passive: false });
        btnTurnRight.addEventListener('touchend', stopTurnRight);
        btnTurnRight.addEventListener('mousedown', startTurnRight);
        btnTurnRight.addEventListener('mouseup', stopTurnRight);
        btnTurnRight.addEventListener('mouseleave', stopTurnRight);

        // Keyboard Controls
        const keys = {};
        window.addEventListener('keydown', (e) => {
            keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                startChargingJump();
            }
            if (e.code === 'KeyR') resetToBottom();
        });

        window.addEventListener('keyup', (e) => {
            keys[e.code] = false;
            if (e.code === 'Space') {
                e.preventDefault();
                releaseChargingJump();
            }
        });

        // Jump Button Event Handlers
        const btnJump = document.getElementById('btn-jump-action');
        btnJump.addEventListener('mousedown', (e) => { e.preventDefault(); startChargingJump(); });
        window.addEventListener('mouseup', () => { if (physics.charging) releaseChargingJump(); });
        btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); startChargingJump(); }, { passive: false });
        btnJump.addEventListener('touchend', (e) => { e.preventDefault(); releaseChargingJump(); });

        function startChargingJump() {
            if (!physics.onGround || physics.charging || physics.reachedWellTop || physics.dead) return;
            if (!gameStartTime) {
                gameStartTime = performance.now();
                isRunActive = true;
            }
            physics.charging = true;
            physics.chargePower = 0.05;
            chargeContainer.classList.remove('opacity-30');
            chargeContainer.classList.add('opacity-100');
            trajSpheres.forEach(dot => { dot.visible = true; });
            if (navigator.vibrate) navigator.vibrate(25);
        }

        function releaseChargingJump() {
            if (!physics.charging) return;
            physics.charging = false;
            chargeContainer.classList.remove('opacity-100');
            chargeContainer.classList.add('opacity-30');
            trajSpheres.forEach(dot => { dot.visible = false; });

            const finalPower = Math.max(0.15, physics.chargePower);
            const totalSpeed = MIN_JUMP_FORCE + finalPower * (MAX_JUMP_FORCE - MIN_JUMP_FORCE);

            const jumpDir = new THREE.Vector3(
                Math.sin(physics.facingAngle),
                1.38,
                Math.cos(physics.facingAngle)
            ).normalize();

            physics.vel.copy(jumpDir.multiplyScalar(totalSpeed));
            physics.onGround = false;
            physics.fallPeakY = physics.pos.y;
            physics.jumpCount++;

            frogAudio.playJump(finalPower);
            if (navigator.vibrate) navigator.vibrate(40);

            physics.chargePower = 0;
            chargeBar.style.width = '0%';
            chargePercent.innerText = '0%';
        }

        function updateTrajectoryLine() {
            if (!physics.charging || !physics.onGround) return;
            const simPos = physics.pos.clone().add(new THREE.Vector3(0, 0.45, 0));
            const currentSpeed = MIN_JUMP_FORCE + physics.chargePower * (MAX_JUMP_FORCE - MIN_JUMP_FORCE);
            const simVel = new THREE.Vector3(
                Math.sin(physics.facingAngle),
                1.38,
                Math.cos(physics.facingAngle)
            ).normalize().multiplyScalar(currentSpeed);

            const dt = 0.052;
            for (let i = 0; i < TRAJ_COUNT; i++) {
                trajSpheres[i].position.copy(simPos);
                simPos.addScaledVector(simVel, dt);
                simVel.y -= GRAVITY * dt;
            }
        }

        function containsPlatformPoint(p, pos) {
            const dx = pos.x - p.pos.x;
            const dz = pos.z - p.pos.z;
            if (p.angle === undefined) return Math.hypot(dx, dz) <= p.radius;
            const localX = dx * Math.sin(p.angle) - dz * Math.cos(p.angle);
            const localZ = dx * Math.cos(p.angle) + dz * Math.sin(p.angle);
            let inside = false;
            for (let i = 0, j = p.outline.length - 1; i < p.outline.length; j = i++) {
                const [ax, az] = p.outline[i];
                const [bx, bz] = p.outline[j];
                if ((az > localZ) !== (bz > localZ) &&
                    localX < (bx - ax) * (localZ - az) / (bz - az) + ax) inside = !inside;
            }
            return inside;
        }

        function updatePhysics(dt) {
            if (physics.dead) return;
            // Turning Speed
            const turnSpeed = 3.4;
            if (keys['KeyA'] || keys['ArrowLeft'] || steerDirection === 1) physics.facingAngle += turnSpeed * dt;
            if (keys['KeyD'] || keys['ArrowRight'] || steerDirection === -1) physics.facingAngle -= turnSpeed * dt;

            // Voxel Frog Crouched Animation Controller
            const nowMs = performance.now();

            if (physics.charging) {
                physics.chargePower = Math.min(1.0, physics.chargePower + dt * 1.18);
                const percent = Math.floor(physics.chargePower * 100);
                chargeBar.style.width = `${percent}%`;
                chargePercent.innerText = `${percent}%`;
                updateTrajectoryLine();

                // Compress body down into tight spring crouch
                const compression = 1.0 - (physics.chargePower * 0.36);
                frogAnimRoot.scale.set(1.0 / Math.sqrt(compression), compression, 1.0 / Math.sqrt(compression));

                // Knees flare outward slightly while charging
                hindLegL.rotation.z = -physics.chargePower * 0.22;
                hindLegR.rotation.z = physics.chargePower * 0.22;
                frontLegL.rotation.x = physics.chargePower * 0.25;
                frontLegR.rotation.x = physics.chargePower * 0.25;
            } else if (physics.onGround) {
                // Gentle throat and chest breathing pulse while resting in crouch
                const breathe = Math.sin(nowMs * 0.005) * 0.035;
                frogAnimRoot.scale.set(1.0 + breathe * 0.5, 1.0 + breathe, 1.0);
                bellyGroup.scale.set(1.0, 1.0, 1.0 + Math.sin(nowMs * 0.007) * 0.12);

                // Reset limbs to resting crouch
                frontLegL.rotation.set(0, 0, 0);
                frontLegR.rotation.set(0, 0, 0);
                hindLegL.rotation.set(0, 0, 0);
                hindLegR.rotation.set(0, 0, 0);
            }

            if (!physics.onGround) {
                // Dynamic leap in mid-air: front legs reach forward, hind legs kick backward
                frogAnimRoot.scale.set(0.92, 1.18, 0.94);
                frontLegL.rotation.x = -0.55;
                frontLegR.rotation.x = -0.55;
                hindLegL.rotation.x = 0.65;
                hindLegR.rotation.x = 0.65;

                physics.vel.y -= GRAVITY * dt;
                physics.fallPeakY = Math.max(physics.fallPeakY, physics.pos.y);
                const previousY = physics.pos.y;
                physics.pos.addScaledVector(physics.vel, dt);

                // Cylinder wall boundary collision
                const horizDist = Math.sqrt(physics.pos.x * physics.pos.x + physics.pos.z * physics.pos.z);
                const maxRadius = WELL_RADIUS - 0.58;

                if (horizDist > maxRadius) {
                    const norm = new THREE.Vector2(physics.pos.x, physics.pos.z).normalize();
                    physics.pos.x = norm.x * maxRadius;
                    physics.pos.z = norm.y * maxRadius;
                    physics.vel.x = -physics.vel.x * 0.35;
                    physics.vel.z = -physics.vel.z * 0.35;
                    frogAudio.playLand();
                }

                // Landing on platforms check
                if (physics.vel.y < 0) {
                    for (let p of platforms) {
                        const platformTopY = p.pos.y + p.height / 2;

                        if (containsPlatformPoint(p, physics.pos) && (Math.abs(physics.pos.y - platformTopY) < 0.62 || (previousY >= platformTopY && physics.pos.y <= platformTopY))) {
                            physics.pos.y = platformTopY;
                            physics.vel.set(0, 0, 0);
                            physics.onGround = true;
                            frogAudio.playLand();
                            checkFatalLanding();

                            if (p.isTopExit && !physics.reachedWellTop && !physics.dead &&
                                Math.hypot(physics.pos.x - p.pos.x, physics.pos.z - p.pos.z) <= p.finishRadius) {
                                triggerVictory();
                            }
                            break;
                        }
                    }
                }

                // Bottom well water landing
                if (physics.pos.y <= 0.38) {
                    const fallSpeed = Math.abs(physics.vel.y);
                    physics.pos.y = 0.38;
                    physics.vel.set(0, 0, 0);
                    physics.onGround = true;
                    frogAudio.playSplash();
                    triggerWaterSplash(physics.pos.x, physics.pos.z, Math.max(1.0, fallSpeed * 0.14));
                    checkFatalLanding();

                    if (storyMilestones.firstJump && !physics.dead) {
                        triggerSpeech("จ๋อม! ตกน้ำก้นบ่อจนได้ ดีนะที่ว่ายน้ำเป็น รีบปีนขึ้นกะลาเร็ว!");
                    }
                }
            }

            frog.position.copy(physics.pos);
            frog.rotation.y = physics.facingAngle;
            frogGlowLight.position.set(physics.pos.x, physics.pos.y + 1.2, physics.pos.z);

            // Update Altitude HUD
            const currentAlt = Math.max(0, physics.pos.y).toFixed(1);
            altitudeText.innerText = `${currentAlt} m`;
            const altPct = Math.min(100, (physics.pos.y / WELL_HEIGHT) * 100);
            altitudeProgress.style.width = `${altPct}%`;

            runMaxAltitude = Math.max(runMaxAltitude, physics.pos.y);
            if (isRunActive && gameStartTime && !physics.reachedWellTop) {
                runElapsedTime = (performance.now() - gameStartTime) / 1000;
                const timerEl = document.getElementById('timer-text');
                if (timerEl) timerEl.innerText = formatGameTime(runElapsedTime);
            }

            if (!physics.dead) checkAltitudeTriggers(physics.pos.y);
        }

        let inspectCamYOffset = null;

        function updateCamera() {
            const targetY = inspectCamYOffset !== null ? inspectCamYOffset : physics.pos.y + 0.65;
            const targetX = inspectCamYOffset !== null ? 0 : physics.pos.x;
            const targetZ = inspectCamYOffset !== null ? 0 : physics.pos.z;
            const lookTarget = new THREE.Vector3(targetX, targetY, targetZ);

            // Free 360 orbit camera (renders through walls with BackSide cutaway seamlessly)
            const dirX = Math.sin(camTheta) * Math.cos(camPhi);
            const dirY = Math.sin(camPhi);
            const dirZ = Math.cos(camTheta) * Math.cos(camPhi);

            const targetCamX = lookTarget.x + dirX * camDistance;
            const targetCamY = Math.max(0.45, lookTarget.y + dirY * camDistance + 0.25);
            const targetCamZ = lookTarget.z + dirZ * camDistance;

            camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.16);
            camera.lookAt(lookTarget);
        }

        const victoryModal = document.getElementById('victory-modal');
        const deathDialog = document.getElementById('death-dialog');
        document.getElementById('btn-death-restart').addEventListener('click', resetToBottom);
        const statJumpCount = document.getElementById('stat-jump-count');
        const btnPlayAgain = document.getElementById('btn-play-again');
        const btnReset = document.getElementById('btn-reset');
        const btnSound = document.getElementById('btn-sound');
        const iconSoundOn = document.getElementById('icon-sound-on');
        const iconSoundOff = document.getElementById('icon-sound-off');

        function checkFatalLanding() {
            const fallHeight = physics.fallPeakY - physics.pos.y;
            physics.fallPeakY = physics.pos.y;
            if (fallHeight < FATAL_FALL_HEIGHT || physics.dead) return;
            physics.dead = true;
            physics.charging = false;
            isRunActive = false;
            closeStory();
            document.getElementById('death-detail').textContent = `ตกลงมา ${fallHeight.toFixed(1)} เมตร น้องกบตายแล้ว`;
            deathDialog.showModal();
        }

        function triggerVictory() {
            physics.reachedWellTop = true;
            isRunActive = false;
            statJumpCount.innerText = `${physics.jumpCount} ครั้ง`;
            const statClearTime = document.getElementById('stat-clear-time');
            if (statClearTime) {
                statClearTime.innerText = formatGameTime(runElapsedTime);
            }
            victoryModal.classList.remove('hidden');
            frogAudio.playFanfare();
        }

        function resetToBottom() {
            physics.pos.set(0, 0.45, 0);
            physics.vel.set(0, 0, 0);
            physics.onGround = true;
            physics.charging = false;
            physics.facingAngle = 0;
            physics.chargePower = 0;
            physics.jumpCount = 0;
            physics.reachedWellTop = false;
            physics.dead = false;
            physics.fallPeakY = physics.pos.y;
            deathDialog.close();
            chargeBar.style.width = '0%';
            chargePercent.innerText = '0%';
            chargeContainer.classList.remove('opacity-100');
            chargeContainer.classList.add('opacity-30');
            trajSpheres.forEach(dot => { dot.visible = false; });
            gameStartTime = null;
            runElapsedTime = 0;
            runMaxAltitude = 0;
            isRunActive = false;
            const timerEl = document.getElementById('timer-text');
            if (timerEl) timerEl.innerText = '00:00.0';
            inspectCamYOffset = null;
            victoryModal.classList.add('hidden');
            triggerSpeech("กลับมาอยู่ในกะลาอันอบอุ่นอีกครั้ง... ลุยใหม่กันเลย!");
            frogAudio.playCroak();
        }

        btnPlayAgain.addEventListener('click', resetToBottom);
        btnReset.addEventListener('click', resetToBottom);

        // ============================================================
        // LEADERBOARD & SQL DATABASE CLIENT (SQLite API + LocalStorage)
        // ============================================================
        const leaderboardModal = document.getElementById('leaderboard-modal');
        const btnLeaderboard = document.getElementById('btn-leaderboard');
        const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
        const btnSubmitScore = document.getElementById('btn-submit-score');
        const inputPlayerName = document.getElementById('input-player-name');
        const lbCurrentStats = document.getElementById('lb-current-stats');
        const lbSaveStatus = document.getElementById('lb-save-status');
        const lbLoading = document.getElementById('lb-loading');
        const lbList = document.getElementById('lb-list');
        const lbStorageType = document.getElementById('lb-storage-type');
        const btnRefreshLb = document.getElementById('btn-refresh-lb');
        const btnVictorySave = document.getElementById('btn-victory-save');

        const LEADERBOARD_CACHE_KEY = 'kob_leaderboard_cache_v2';

        function getLocalLeaderboard() {
            try {
                const stored = localStorage.getItem(LEADERBOARD_CACHE_KEY);
                if (stored) return JSON.parse(stored);
            } catch(e) {}
            return [];
        }

        function saveLocalLeaderboard(list) {
            try {
                localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify(list));
            } catch(e) {}
        }

        async function fetchLeaderboardData() {
            if (lbLoading) lbLoading.classList.remove('hidden');
            if (lbList) lbList.classList.add('hidden');

            let rows = null;
            let isSqlite = false;

            try {
                const resp = await fetch('/api/leaderboard', { cache: 'no-store' });
                if (resp.ok) {
                    const json = await resp.json();
                    if (json && json.success && Array.isArray(json.data)) {
                        rows = json.data;
                        isSqlite = true;
                        saveLocalLeaderboard(rows);
                    }
                }
            } catch(e) {}

            if (!rows) {
                rows = getLocalLeaderboard();
                isSqlite = false;
            }

            renderLeaderboardRows(rows, isSqlite);
        }

        function renderLeaderboardRows(rows, isSqlite) {
            if (lbLoading) lbLoading.classList.add('hidden');
            if (!lbList) return;
            lbList.innerHTML = '';
            if (rows.length === 0) lbList.textContent = 'ยังไม่มีคะแนนในตารางอันดับ';

            if (lbStorageType) {
                lbStorageType.innerText = isSqlite
                    ? '🗄️ ฐานข้อมูล: ออนไลน์'
                    : '📱 ฐานข้อมูล: Offline Cache (LocalStorage)';
            }

            rows.sort((a, b) => {
                const diffH = (parseFloat(b.max_height) || 0) - (parseFloat(a.max_height) || 0);
                if (Math.abs(diffH) > 0.05) return diffH;
                return (parseFloat(a.clear_time_seconds) || 0) - (parseFloat(b.clear_time_seconds) || 0);
            });

            rows.forEach((row, idx) => {
                const rank = idx + 1;
                let medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                const isEscaped = row.is_escaped ? true : false;
                const timeStr = formatGameTime(parseFloat(row.clear_time_seconds) || 0);

                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-2 rounded-xl text-xs bg-slate-900/80 border ' + 
                    (rank <= 3 ? 'border-amber-500/40 text-amber-200' : 'border-slate-800 text-slate-300');

                item.innerHTML = `
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="font-bold text-sm w-6 text-center">${medal}</span>
                        <div class="truncate">
                            <span class="font-bold text-white">${escapeHtml(row.player_name || 'กบนิรนาม')}</span>
                            ${isEscaped ? '<span class="ml-1 text-[9px] bg-emerald-600/90 text-white px-1.5 py-0.2 rounded font-bold">พ้นบ่อ 🌤️</span>' : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-3 font-mono text-[11px] whitespace-nowrap">
                        <span class="text-yellow-300 font-bold">${parseFloat(row.max_height).toFixed(1)}m</span>
                        <span class="text-cyan-300">${timeStr}</span>
                        <span class="text-slate-400 text-[10px]">(${row.jump_count || 0} โดด)</span>
                    </div>
                `;
                lbList.appendChild(item);
            });

            lbList.classList.remove('hidden');
        }

        function escapeHtml(str) {
            return String(str).replace(/[&<>"']/g, m => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[m]));
        }

        function openLeaderboardModal() {
            if (!leaderboardModal) return;
            const currentH = Math.max(physics.pos.y, runMaxAltitude).toFixed(1);
            const currentT = formatGameTime(runElapsedTime);
            if (lbCurrentStats) {
                lbCurrentStats.innerText = `สูง ${currentH}m | เวลา ${currentT} | โดด ${physics.jumpCount} ครั้ง`;
            }
            if (inputPlayerName && !inputPlayerName.value) {
                const savedName = localStorage.getItem('kob_player_name');
                if (savedName) inputPlayerName.value = savedName;
            }
            if (lbSaveStatus) lbSaveStatus.classList.add('hidden');
            leaderboardModal.classList.remove('hidden');
            fetchLeaderboardData();
            frogAudio.playCroak();
        }

        if (btnLeaderboard) btnLeaderboard.addEventListener('click', openLeaderboardModal);
        if (btnCloseLeaderboard) btnCloseLeaderboard.addEventListener('click', () => leaderboardModal.classList.add('hidden'));
        if (btnRefreshLb) btnRefreshLb.addEventListener('click', fetchLeaderboardData);

        if (btnVictorySave) {
            btnVictorySave.addEventListener('click', () => {
                victoryModal.classList.add('hidden');
                openLeaderboardModal();
            });
        }

        if (btnSubmitScore) {
            btnSubmitScore.addEventListener('click', async () => {
                const name = (inputPlayerName.value || 'นายน้องกบ').trim().slice(0, 30);
                if (!name) return;

                localStorage.setItem('kob_player_name', name);

                const height = Math.max(0.1, parseFloat(Math.max(physics.pos.y, runMaxAltitude).toFixed(2)));
                const clearTime = parseFloat(runElapsedTime.toFixed(2));
                const jumpCount = physics.jumpCount;
                const isEscaped = physics.reachedWellTop ? 1 : 0;
                const deviceType = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

                btnSubmitScore.disabled = true;
                btnSubmitScore.innerText = 'กำลังบันทึก...';

                let savedToApi = false;
                let apiErrorMessage = null;
                try {
                    const resp = await fetch('/api/leaderboard', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            player_name: name,
                            max_height: height,
                            clear_time_seconds: clearTime,
                            jump_count: jumpCount,
                            is_escaped: isEscaped,
                            device_type: deviceType
                        })
                    });
                    if (resp.ok) {
                        const json = await resp.json();
                        if (json && json.success) {
                            savedToApi = true;
                            if (json.data) {
                                saveLocalLeaderboard(json.data);
                                renderLeaderboardRows(json.data, true);
                            }
                        }
                    } else {
                        const errJson = await resp.json().catch(() => ({}));
                        apiErrorMessage = errJson.error || 'เซิร์ฟเวอร์ปฏิเสธการบันทึกคะแนน';
                    }
                } catch(e) {
                    // Offline / Network failure
                }

                if (!savedToApi && !apiErrorMessage) {
                    const currentList = getLocalLeaderboard();
                    currentList.push({
                        player_name: name,
                        max_height: height,
                        clear_time_seconds: clearTime,
                        jump_count: jumpCount,
                        is_escaped: isEscaped,
                        device_type: deviceType,
                        created_at: new Date().toISOString()
                    });
                    saveLocalLeaderboard(currentList);
                    renderLeaderboardRows(currentList, false);
                }

                if (lbSaveStatus) {
                    if (savedToApi) {
                        lbSaveStatus.innerText = '✅ บันทึกลงฐานข้อมูลออนไลน์สำเร็จ!';
                        lbSaveStatus.className = 'text-[9px] text-emerald-400 mt-1';
                    } else if (apiErrorMessage) {
                        lbSaveStatus.innerText = '⚠️ ' + apiErrorMessage;
                        lbSaveStatus.className = 'text-[9px] text-rose-400 mt-1';
                    } else {
                        lbSaveStatus.innerText = '💾 บันทึกลงหน่วยความจำเครื่องสำเร็จ (โหมดออฟไลน์)';
                        lbSaveStatus.className = 'text-[9px] text-amber-400 mt-1';
                    }
                    lbSaveStatus.classList.remove('hidden');
                }

                btnSubmitScore.disabled = false;
                btnSubmitScore.innerText = 'บันทึกอีกครั้ง';
                frogAudio.playCroak();
            });
        }

        // PWA WebApp Install Prompt
        let deferredInstallPrompt = null;
        window.addEventListener('beforeinstallprompt', e => {
            e.preventDefault();
            deferredInstallPrompt = e;
            const btnInstall = document.getElementById('btn-install-app');
            if (btnInstall) {
                btnInstall.classList.remove('hidden');
                btnInstall.classList.add('flex');
            }
        });

        const btnInstallApp = document.getElementById('btn-install-app');
        if (btnInstallApp) {
            btnInstallApp.addEventListener('click', async () => {
                if (deferredInstallPrompt) {
                    deferredInstallPrompt.prompt();
                    const { outcome } = await deferredInstallPrompt.userChoice;
                    if (outcome === 'accepted') {
                        btnInstallApp.classList.add('hidden');
                    }
                    deferredInstallPrompt = null;
                }
            });
        }

        // PBR Wall Inspector Controls (STEP 1)
        const pbrInspectorPanel = document.getElementById('pbr-inspector-panel');
        const btnCloseInspector = document.getElementById('btn-close-inspector');
        const pbrPresetDesc = document.getElementById('pbr-preset-desc');
        const btnWallPreset = document.getElementById('btn-wall-preset');
        const labelWallPreset = document.getElementById('label-wall-preset');

        if (btnWallPreset) {
            btnWallPreset.addEventListener('click', () => {
                if (pbrInspectorPanel) {
                    pbrInspectorPanel.classList.toggle('hidden');
                }
            });
        }

        if (btnCloseInspector) {
            btnCloseInspector.addEventListener('click', () => {
                pbrInspectorPanel.classList.add('hidden');
            });
        }

        function updatePresetUI(idx) {
            const p = applyWallScalePreset(idx);
            if (labelWallPreset) labelWallPreset.innerText = `${p.rx}x${p.ry}`;
            if (pbrPresetDesc) pbrPresetDesc.innerText = p.desc;
            for (let i = 0; i < 3; i++) {
                const btn = document.getElementById(`btn-preset-${i}`);
                if (btn) {
                    if (i === idx) {
                        btn.className = 'btn-pbr-preset bg-emerald-600 text-white py-1 px-1 rounded-lg text-[10px] font-bold text-center';
                    } else {
                        btn.className = 'btn-pbr-preset bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 px-1 rounded-lg text-[10px] text-center';
                    }
                }
            }
            triggerSpeech(`ผนังหิน: ${p.name} - ${p.desc}`);
            frogAudio.playJump(0.25);
        }

        for (let i = 0; i < 3; i++) {
            const btn = document.getElementById(`btn-preset-${i}`);
            if (btn) {
                btn.addEventListener('click', () => updatePresetUI(i));
            }
        }

        // PBR Map Toggles
        const toggleNormal = document.getElementById('toggle-normal');
        let normalEnabled = true;
        if (toggleNormal) {
            toggleNormal.addEventListener('click', () => {
                normalEnabled = !normalEnabled;
                wellMat.normalMap = normalEnabled ? wellNormalMap : null;
                wellMat.needsUpdate = true;
                toggleNormal.innerText = `Normal: ${normalEnabled ? 'ON' : 'OFF'}`;
                toggleNormal.className = normalEnabled
                    ? 'bg-emerald-700 text-white py-1 rounded-lg text-[9px] font-bold text-center'
                    : 'bg-rose-900 text-rose-200 py-1 rounded-lg text-[9px] font-bold text-center';
            });
        }

        const toggleRoughness = document.getElementById('toggle-roughness');
        let roughnessEnabled = true;
        if (toggleRoughness) {
            toggleRoughness.addEventListener('click', () => {
                roughnessEnabled = !roughnessEnabled;
                wellMat.roughnessMap = roughnessEnabled ? wellRoughnessMap : null;
                wellMat.needsUpdate = true;
                toggleRoughness.innerText = `Rough: ${roughnessEnabled ? 'ON' : 'OFF'}`;
                toggleRoughness.className = roughnessEnabled
                    ? 'bg-emerald-700 text-white py-1 rounded-lg text-[9px] font-bold text-center'
                    : 'bg-rose-900 text-rose-200 py-1 rounded-lg text-[9px] font-bold text-center';
            });
        }

        const toggleAo = document.getElementById('toggle-ao');
        let aoEnabled = true;
        if (toggleAo) {
            toggleAo.addEventListener('click', () => {
                aoEnabled = !aoEnabled;
                wellMat.aoMap = aoEnabled ? wellAoMap : null;
                wellMat.needsUpdate = true;
                toggleAo.innerText = `AO: ${aoEnabled ? 'ON' : 'OFF'}`;
                toggleAo.className = aoEnabled
                    ? 'bg-emerald-700 text-white py-1 rounded-lg text-[9px] font-bold text-center'
                    : 'bg-rose-900 text-rose-200 py-1 rounded-lg text-[9px] font-bold text-center';
            });
        }

        const toggleGodRays = document.getElementById('toggle-godrays');
        let godRaysEnabled = true;
        if (toggleGodRays) {
            toggleGodRays.addEventListener('click', () => {
                godRaysEnabled = !godRaysEnabled;
                godRayGroup.visible = godRaysEnabled;
                toggleGodRays.innerText = `God Rays: ${godRaysEnabled ? 'ON' : 'OFF'}`;
                toggleGodRays.className = godRaysEnabled
                    ? 'bg-emerald-700 text-white py-1 rounded-lg text-[9px] font-bold text-center'
                    : 'bg-rose-900 text-rose-200 py-1 rounded-lg text-[9px] font-bold text-center';
            });
        }

        const toggleSun = document.getElementById('toggle-sun');
        let sunEnabled = true;
        if (toggleSun) {
            toggleSun.addEventListener('click', () => {
                sunEnabled = !sunEnabled;
                sunLight.visible = sunEnabled;
                openingLight.visible = sunEnabled;
                toggleSun.innerText = `Sunlight: ${sunEnabled ? 'ON' : 'OFF'}`;
                toggleSun.className = sunEnabled
                    ? 'bg-emerald-700 text-white py-1 rounded-lg text-[9px] font-bold text-center'
                    : 'bg-rose-900 text-rose-200 py-1 rounded-lg text-[9px] font-bold text-center';
            });
        }

        const btnWaterCam = document.getElementById('btn-water-cam');
        if (btnWaterCam) {
            btnWaterCam.addEventListener('click', () => {
                inspectCamYOffset = 0.45;
                camDistance = 4.2;
                camPhi = 0.35;
                triggerSpeech("ซูมดูก้นบ่อ: ผิวน้ำ 2-Layer PBR, มอส และเศษแหนลอยน้ำ");
                frogAudio.playCroak();
            });
        }

        const btnSplashTest = document.getElementById('btn-splash-test');
        if (btnSplashTest) {
            btnSplashTest.addEventListener('click', () => {
                triggerWaterSplash(0.8, 0.4, 2.0);
                frogAudio.playSplash();
                triggerSpeech("จ๋อม! ทดสอบคลื่นน้ำกระเพื่อมและละอองน้ำกระเซ็น");
            });
        }

        const toggleVeg = document.getElementById('toggle-veg');
        let vegEnabled = true;
        if (toggleVeg) {
            toggleVeg.addEventListener('click', () => {
                vegEnabled = !vegEnabled;
                vegGroup.visible = vegEnabled;
                toggleVeg.innerText = `พืชพรรณ: ${vegEnabled ? 'ON' : 'OFF'}`;
                toggleVeg.className = vegEnabled
                    ? 'bg-emerald-700 text-white py-1 rounded-lg text-[9px] font-bold text-center'
                    : 'bg-rose-900 text-rose-200 py-1 rounded-lg text-[9px] font-bold text-center';
            });
        }

        const btnMidCam = document.getElementById('btn-mid-cam');
        if (btnMidCam) {
            btnMidCam.addEventListener('click', () => {
                inspectCamYOffset = WELL_HEIGHT * 0.5;
                camDistance = 5.6;
                camPhi = 0.22;
                triggerSpeech(`ส่องดงเฟิร์น มอส และเถาวัลย์กลางบ่อน้ำ (${WELL_HEIGHT * 0.5} เมตร)`);
                frogAudio.playCroak();
            });
        }

        // 8. 3D Stones & Silhouette Controls (STEP 5)
        const toggleStones = document.getElementById('toggle-stones');
        let stonesEnabled = true;
        if (toggleStones) {
            toggleStones.addEventListener('click', () => {
                stonesEnabled = !stonesEnabled;
                stoneDetailGroup.visible = stonesEnabled;
                toggleStones.innerText = `หิน 3D: ${stonesEnabled ? 'ON' : 'OFF'}`;
                toggleStones.className = stonesEnabled
                    ? 'bg-emerald-700 text-white py-1 rounded-lg text-[9px] font-bold text-center'
                    : 'bg-rose-900 text-rose-200 py-1 rounded-lg text-[9px] font-bold text-center';
            });
        }

        const btnRimCam = document.getElementById('btn-rim-cam');
        if (btnRimCam) {
            btnRimCam.addEventListener('click', () => {
                inspectCamYOffset = WELL_HEIGHT - 6.5;
                camDistance = 6.2;
                camPhi = 0.28;
                triggerSpeech(`ส่องหินขอบปากบ่อ แสงตะวัน และรากไม้โบราณ (${WELL_HEIGHT - 6.5} เมตร)`);
                frogAudio.playCroak();
            });
        }

        // 9. Quality Presets System (STEP 5: LOW / MEDIUM / HIGH)
        const qualityDescriptions = {
            LOW: 'DPR 1.0x, ปิดเงา Shadow, ก้อนหิน 3D ย่อส่วน (ประหยัดพลังงาน)',
            MEDIUM: 'DPR 1.5x, เงา Soft Shadows, หิน 3D ครบถ้วน (แนะนำสำหรับมือถือทั่วไป)',
            HIGH: 'DPR 2.0x, เงาความละเอียดสูง, ละอองแสงเต็มรูปแบบ (สำหรับ PC / หน้าจอคมชัดสูง)'
        };

        let currentQuality = 'MEDIUM';

        function setGraphicsQuality(level, announce = false) {
            currentQuality = level;
            const isLow = level === 'LOW';
            const isHigh = level === 'HIGH';

            // 1. Pixel Ratio & Size
            let targetDPR = 1.0;
            if (isHigh) {
                targetDPR = Math.min(window.devicePixelRatio || 1, 2.0);
            } else if (level === 'MEDIUM') {
                targetDPR = Math.min(window.devicePixelRatio || 1, 1.5);
            } else {
                targetDPR = 1.0;
            }
            renderer.setPixelRatio(targetDPR);
            renderer.setSize(getW(), getH());

            // 2. Shadows
            const wantShadows = !isLow;
            if (renderer.shadowMap.enabled !== wantShadows) {
                renderer.shadowMap.enabled = wantShadows;
                renderer.shadowMap.type = isHigh ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
                scene.traverse(obj => {
                    if (obj.material) {
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach(m => m.needsUpdate = true);
                        } else {
                            obj.material.needsUpdate = true;
                        }
                    }
                });
            }

            // 3. 3D Stone Details & Vegetation
            stoneDetailGroup.visible = !isLow;
            if (toggleStones) {
                stonesEnabled = !isLow;
                toggleStones.innerText = `หิน 3D: ${stonesEnabled ? 'ON' : 'OFF'}`;
                toggleStones.className = stonesEnabled
                    ? 'bg-emerald-700 text-white py-1 rounded-lg text-[9px] font-bold text-center'
                    : 'bg-rose-900 text-rose-200 py-1 rounded-lg text-[9px] font-bold text-center';
            }

            // 4. Mists & Sun Motes Density
            if (mist) {
                mist.material.opacity = isLow ? 0.08 : (isHigh ? 0.28 : 0.22);
            }
            if (sunMotes) {
                sunMotes.visible = !isLow;
            }

            // 5. Persist
            try {
                localStorage.setItem('kob_kala_quality', level);
            } catch(e) {}

            // 6. UI Updates
            const labelQuickQuality = document.getElementById('label-quick-quality');
            if (labelQuickQuality) {
                labelQuickQuality.innerText = level === 'MEDIUM' ? 'MED' : level;
            }

            const qualityDesc = document.getElementById('quality-desc');
            if (qualityDesc && qualityDescriptions[level]) {
                qualityDesc.innerText = qualityDescriptions[level];
            }

            ['low', 'med', 'high'].forEach(l => {
                const btn = document.getElementById(`btn-quality-${l}`);
                if (btn) {
                    const matches = (l === 'med' && level === 'MEDIUM') || (l.toUpperCase() === level);
                    if (matches) {
                        btn.className = 'btn-quality-opt bg-emerald-600 text-white py-1 px-1 rounded-lg text-[9px] font-bold text-center border border-emerald-400';
                    } else {
                        btn.className = 'btn-quality-opt bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 px-1 rounded-lg text-[9px] text-center border border-slate-700';
                    }
                }
            });

            if (announce) {
                triggerSpeech(`ปรับคุณภาพกราฟิกเป็นระดับ ${level}: ${qualityDescriptions[level]}`);
                frogAudio.playCroak();
            }
        }

        // Quick toggle button in top bar
        const btnQuickQuality = document.getElementById('btn-quick-quality');
        if (btnQuickQuality) {
            btnQuickQuality.addEventListener('click', () => {
                const order = ['LOW', 'MEDIUM', 'HIGH'];
                const nextIdx = (order.indexOf(currentQuality) + 1) % order.length;
                setGraphicsQuality(order[nextIdx], true);
            });
        }

        // Inspector Quality Buttons
        const btnQuesLow = document.getElementById('btn-quality-low');
        if (btnQuesLow) btnQuesLow.addEventListener('click', () => setGraphicsQuality('LOW', true));

        const btnQuesMed = document.getElementById('btn-quality-med');
        if (btnQuesMed) btnQuesMed.addEventListener('click', () => setGraphicsQuality('MEDIUM', true));

        const btnQuesHigh = document.getElementById('btn-quality-high');
        if (btnQuesHigh) btnQuesHigh.addEventListener('click', () => setGraphicsQuality('HIGH', true));

        // Height inspection view buttons
        document.querySelectorAll('.btn-cam-view').forEach(btn => {
            btn.addEventListener('click', () => {
                const h = btn.getAttribute('data-h');
                if (h === 'frog') {
                    inspectCamYOffset = null;
                    triggerSpeech("มุมกล้องกลับมาจับที่ตัวน้องกบ");
                } else {
                    inspectCamYOffset = parseFloat(h);
                    triggerSpeech(`ส่องผนังหินที่ความสูงระดับ ${inspectCamYOffset} เมตร`);
                }
                frogAudio.playCroak();
            });
        });

        // Zoom buttons
        const btnZoomIn = document.getElementById('btn-zoom-in');
        if (btnZoomIn) {
            btnZoomIn.addEventListener('click', () => {
                camDistance = Math.max(2.2, camDistance - 1.2);
            });
        }
        const btnZoomOut = document.getElementById('btn-zoom-out');
        if (btnZoomOut) {
            btnZoomOut.addEventListener('click', () => {
                camDistance = Math.min(14.0, camDistance + 1.2);
            });
        }

        btnSound.addEventListener('click', () => {
            frogAudio.enabled = !frogAudio.enabled;
            if (frogAudio.enabled) {
                iconSoundOn.classList.remove('hidden');
                iconSoundOff.classList.add('hidden');
                frogAudio.playCroak();
            } else {
                iconSoundOn.classList.add('hidden');
                iconSoundOff.classList.remove('hidden');
            }
        });

        // Responsive Resizing for Portrait & Landscape
        function handleResize() {
            const w = getW();
            const h = getH();
            camera.aspect = w / h;

            if (w < h) {
                camera.fov = 60;
                camDistance = 6.4;
            } else {
                camera.fov = 50;
                camDistance = 5.5;
            }

            camera.updateProjectionMatrix();

            let targetDPR = 1.0;
            if (currentQuality === 'HIGH') {
                targetDPR = Math.min(window.devicePixelRatio || 1, 2.0);
            } else if (currentQuality === 'MEDIUM') {
                targetDPR = Math.min(window.devicePixelRatio || 1, 1.5);
            } else {
                targetDPR = 1.0;
            }
            renderer.setPixelRatio(targetDPR);
            renderer.setSize(w, h);
        }

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 150);
        });

        let lastTime = performance.now();

        function animate(now) {
            requestAnimationFrame(animate);
            const dt = Math.min((now - lastTime) / 1000, 0.08);
            lastTime = now;

            updatePhysics(dt);
            updateCamera();

            // STEP 3: 2-Layer Normal Scrolling
            waterNormal1.offset.x = (now * 0.000038) % 1;
            waterNormal1.offset.y = (now * 0.000026) % 1;
            waterNormal2.offset.x = -(now * 0.000072) % 1;
            waterNormal2.offset.y = (now * 0.000052) % 1;

            // Water breathing + gentle surface oscillation
            const waterY = 0.20 + Math.sin(now * 0.0018) * 0.015;
            waterMesh.position.y = waterY;
            waterSheenMesh.position.y = waterY + 0.012;
            algae.position.y = waterY - 0.20;
            lilyPadMesh.position.y = waterY - 0.20;

            // Ambient coconut ripple rings
            for (let i = 0; i < waterRipples.length; i++) {
                const ring = waterRipples[i];
                const cycle = ((now * 0.00020) + ring.userData.phase) % 1;
                const scale = 0.70 + cycle * 7.5;
                ring.scale.set(scale, scale, scale);
                ring.material.opacity = (1 - cycle) * 0.18;
            }

            // Dynamic splash ripple ring pool animation
            for (let item of splashPool) {
                if (!item.active) continue;
                const elapsed = (now - item.startTime - item.delay) / 1000;
                if (elapsed < 0) continue;
                const progress = elapsed / item.duration;
                if (progress >= 1.0) {
                    item.active = false;
                    item.mesh.visible = false;
                } else {
                    const scale = 0.4 + progress * item.maxScale;
                    item.mesh.scale.set(scale, scale, scale);
                    item.mesh.material.opacity = (1.0 - progress) * 0.55;
                }
            }

            // Dynamic splash droplets physics
            let anyActiveDrops = false;
            const dropPos = splashDropGeo.attributes.position.array;
            for (let i = 0; i < splashDropCount; i++) {
                const v = splashDropVel[i];
                if (v.life > 0) {
                    v.life -= dt;
                    v.y -= 9.8 * dt;
                    dropPos[i * 3]     += v.x * dt;
                    dropPos[i * 3 + 1] += v.y * dt;
                    dropPos[i * 3 + 2] += v.z * dt;
                    if (dropPos[i * 3 + 1] <= 0.20) {
                        v.life = 0;
                        dropPos[i * 3 + 1] = -100;
                    } else {
                        anyActiveDrops = true;
                    }
                }
            }
            if (anyActiveDrops) splashDropGeo.attributes.position.needsUpdate = true;

            // Fireflies hover around a stable base instead of accumulating drift
            const positions = fireflyGeo.attributes.position.array;
            for (let i = 0; i < fireflyCount; i++) {
                positions[i * 3 + 1] = fireflyBaseY[i] + Math.sin(now * 0.0012 + i * 1.71) * 0.22;
            }
            fireflyGeo.attributes.position.needsUpdate = true;
            fireflyMat.opacity = 0.72 + Math.sin(now * 0.003) * 0.13;

            // Slow vertical moisture drift
            const mistPos = mistGeo.attributes.position.array;
            for (let i = 0; i < mistCount; i++) {
                mistPos[i * 3 + 1] = mistBaseY[i] + Math.sin(now * 0.00055 + i * 0.47) * 0.55;
            }
            mistGeo.attributes.position.needsUpdate = true;

            // Light shafts pulse almost imperceptibly to avoid a static-cardboard look
            rayMat.opacity = 0.18 + Math.sin(now * 0.0007) * 0.022;
            rayMatInner.opacity = 0.12 + Math.sin(now * 0.0009 + 1.4) * 0.016;
            rayMatSide.opacity = 0.08 + Math.sin(now * 0.00082 + 2.3) * 0.012;

            // Sun motes hover in the shaft
            const motePos = moteGeo.attributes.position.array;
            for (let i = 0; i < moteCount; i++) {
                motePos[i * 3 + 1] = moteBaseY[i] + Math.sin(now * 0.0008 * moteSpeed[i] + i) * 0.45;
            }
            moteGeo.attributes.position.needsUpdate = true;
            moteMat.opacity = 0.50 + Math.sin(now * 0.0015) * 0.12;
            waterMat.roughness = 0.16 + Math.sin(now * 0.00048) * 0.02;

            renderer.render(scene, camera);
        }

        function launchGame() {
            const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
            const savedQuality = localStorage.getItem('kob_kala_quality') || (isMobileDevice ? 'MEDIUM' : 'HIGH');
            setGraphicsQuality(savedQuality, false);
            handleResize();
            requestAnimationFrame(animate);
        }

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(launchGame, 50);
        } else {
            document.addEventListener('DOMContentLoaded', launchGame);
        }
