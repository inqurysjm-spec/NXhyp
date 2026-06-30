/* ============================================================
   STUDYVERSE — 3D engine (Three.js r128, global THREE)
   Builds the customizable low-poly character, the walking
   world, and the study scene. Pure rendering; game logic
   lives in study-app.js and talks to this via SV_WORLD.
   ============================================================ */

window.SV_WORLD = (function () {
  let renderer, clock;
  let mode = 'idle';            // 'world' | 'study'
  let worldScene, worldCam;
  let studyScene, studyCam;
  let player;                   // player character group (world)
  let locations = [];           // interactive buildings
  let onPrompt = null;          // callback(location|null)
  let nearLocation = null;
  let keys = {};
  let joy = { x: 0, y: 0 };
  let studyChars = [];          // {group, state} in study scene
  let hemi, sun, skyMesh, skyTex, sunGlow; // world lighting

  // -------- text sprite helper -------------------------------------
  function makeLabel(text, opts) {
    opts = opts || {};
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, 256, 64);
    if (opts.bg) {
      ctx.fillStyle = opts.bg;
      roundRect(ctx, 8, 8, 240, 48, 14); ctx.fill();
    }
    ctx.font = (opts.size || 30) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = opts.color || '#fff';
    ctx.fillText(text, 128, 34);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(opts.scale || 2.4, (opts.scale || 2.4) * 0.25, 1);
    sp.userData.canvas = cv; sp.userData.ctx = ctx; sp.userData.tex = tex; sp.userData.opts = opts;
    return sp;
  }
  function updateLabel(sp, text) {
    const o = sp.userData.opts, ctx = sp.userData.ctx;
    ctx.clearRect(0, 0, 256, 64);
    if (o.bg) { ctx.fillStyle = o.bg; roundRect(ctx, 8, 8, 240, 48, 14); ctx.fill(); }
    ctx.font = (o.size || 30) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = o.color || '#fff';
    ctx.fillText(text, 128, 34);
    sp.userData.tex.needsUpdate = true;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // -------- character ----------------------------------------------
  // cfg: { skin, hair, outfit, accessory }  name: string
  function buildCharacter(cfg, name) {
    cfg = cfg || {};
    const skin = cfg.skin || '#ffdbac';
    const hair = cfg.hair || '#6b4423';
    const outfit = cfg.outfit || '#14b8a6';
    const g = new THREE.Group();
    const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0.05 });

    // legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.55, 0.22);
    const legMat = mat('#33405e');
    const lLeg = new THREE.Mesh(legGeo, legMat); lLeg.position.set(-0.14, 0.28, 0);
    const rLeg = new THREE.Mesh(legGeo, legMat); rLeg.position.set(0.14, 0.28, 0);
    // body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.3), mat(outfit));
    body.position.y = 0.85;
    // arms
    const armGeo = new THREE.BoxGeometry(0.16, 0.5, 0.16);
    const lArm = new THREE.Mesh(armGeo, mat(outfit)); lArm.position.set(-0.36, 0.92, 0); lArm.geometry.translate(0, -0.2, 0);
    const rArm = new THREE.Mesh(armGeo, mat(outfit)); rArm.position.set(0.36, 0.92, 0); rArm.geometry.translate(0, -0.2, 0);
    // hands (skin)
    const handGeo = new THREE.BoxGeometry(0.17, 0.14, 0.17);
    const lHand = new THREE.Mesh(handGeo, mat(skin)); lHand.position.y = -0.45; lArm.add(lHand);
    const rHand = new THREE.Mesh(handGeo, mat(skin)); rHand.position.y = -0.45; rArm.add(rHand);
    // head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), mat(skin));
    head.position.y = 1.38;
    // eyes
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.08, 0.04);
    const eyeMat = mat('#1a1a2a');
    const lEye = new THREE.Mesh(eyeGeo, eyeMat); lEye.position.set(-0.1, 0.02, 0.21); head.add(lEye);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat); rEye.position.set(0.1, 0.02, 0.21); head.add(rEye);
    // hair (cap)
    const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.46), mat(hair));
    hairMesh.position.set(0, 0.26, 0); head.add(hairMesh);
    const hairFront = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.1), mat(hair));
    hairFront.position.set(0, 0.16, 0.2); head.add(hairFront);

    // accessory
    if (cfg.accessory === 'glasses') {
      const gm = mat('#222');
      const gl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.02), gm); gl.position.set(-0.1, 0.02, 0.22); head.add(gl);
      const gr = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.02), gm); gr.position.set(0.1, 0.02, 0.22); head.add(gr);
    } else if (cfg.accessory === 'cap') {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.48), mat('#ef4444')); cap.position.set(0, 0.3, 0); head.add(cap);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.25), mat('#ef4444')); brim.position.set(0, 0.26, 0.3); head.add(brim);
    } else if (cfg.accessory === 'crown') {
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.16, 8), mat('#eab308')); crown.position.set(0, 0.34, 0); head.add(crown);
    }

    g.add(lLeg, rLeg, body, lArm, rArm, head);
    g.userData.parts = { lLeg, rLeg, body, lArm, rArm, head, lEye, rEye };
    g.userData.cfg = cfg;
    g.userData.state = 'idle';
    g.userData.t = Math.random() * 10;

    // name tag
    if (name) {
      const tag = makeLabel(name, { color: '#fff', bg: 'rgba(20,20,40,0.8)', size: 26, scale: 2.0 });
      tag.position.y = 2.15; g.add(tag); g.userData.nameTag = tag;
    }
    // coin tag (hidden until set)
    const coinTag = makeLabel('', { color: '#fde047', size: 28, scale: 1.8 });
    coinTag.position.y = 1.85; coinTag.visible = false; g.add(coinTag); g.userData.coinTag = coinTag;

    // Zzz sprite for sleeping
    const zzz = makeLabel('💤', { color: '#fff', size: 40, scale: 1.0 });
    zzz.position.set(0.3, 2.0, 0); zzz.visible = false; g.add(zzz); g.userData.zzz = zzz;

    return g;
  }

  function setCharCoins(g, text) {
    if (!g.userData.coinTag) return;
    if (text == null) { g.userData.coinTag.visible = false; return; }
    g.userData.coinTag.visible = true;
    updateLabel(g.userData.coinTag, text);
  }

  function animateChar(g, dt) {
    const p = g.userData.parts;
    if (!p) return;
    g.userData.t += dt;
    const t = g.userData.t;
    const s = g.userData.state;
    // reset rotations baseline
    if (s === 'walking' || s === 'running') {
      const sp = s === 'running' ? 14 : 8;
      const amp = s === 'running' ? 0.9 : 0.6;
      p.lLeg.rotation.x = Math.sin(t * sp) * amp;
      p.rLeg.rotation.x = -Math.sin(t * sp) * amp;
      p.lArm.rotation.x = -Math.sin(t * sp) * amp * 0.8;
      p.rArm.rotation.x = Math.sin(t * sp) * amp * 0.8;
      p.body.position.y = 0.85 + Math.abs(Math.sin(t * sp)) * 0.04;
      g.userData.zzz.visible = false;
    } else if (s === 'studying') {
      p.lLeg.rotation.x = -1.4; p.rLeg.rotation.x = -1.4; // seated
      p.lArm.rotation.x = -1.0;
      p.rArm.rotation.x = -1.0 + Math.sin(t * 6) * 0.25;   // writing
      p.head.rotation.x = 0.25;
      p.body.position.y = 0.7;
      g.userData.zzz.visible = false;
    } else if (s === 'sleeping') {
      p.lLeg.rotation.x = -1.4; p.rLeg.rotation.x = -1.4;
      p.lArm.rotation.x = -0.2; p.rArm.rotation.x = -0.2;
      p.head.rotation.z = 0.4; p.head.rotation.x = 0.2;
      p.body.position.y = 0.7;
      g.userData.zzz.visible = true;
      g.userData.zzz.position.y = 2.0 + Math.sin(t * 2) * 0.12;
      g.userData.zzz.material.opacity = 0.6 + Math.sin(t * 2) * 0.3;
    } else if (s === 'waving') {
      p.lLeg.rotation.x = 0; p.rLeg.rotation.x = 0;
      p.rArm.rotation.z = -2.4; p.rArm.rotation.x = Math.sin(t * 10) * 0.3;
      p.lArm.rotation.x = 0;
      p.body.position.y = 0.85;
      g.userData.zzz.visible = false;
    } else { // idle / chatting
      p.lLeg.rotation.x = 0; p.rLeg.rotation.x = 0;
      p.lArm.rotation.x = 0; p.rArm.rotation.x = 0;
      p.lArm.rotation.z = 0; p.rArm.rotation.z = 0;
      p.head.rotation.set(0, 0, 0);
      p.body.position.y = 0.85 + Math.sin(t * 2) * 0.03; // breathing
      g.userData.zzz.visible = false;
    }
  }

  function setState(g, s) { if (g) g.userData.state = s; }

  // -------- trees / scenery ----------------------------------------
  function makeTree() {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.8, 6),
      new THREE.MeshStandardMaterial({ color: '#6b4423', roughness: 1 }));
    trunk.position.y = 0.4;
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.3, 7),
      new THREE.MeshStandardMaterial({ color: '#3fa34d', roughness: 1 }));
    leaves.position.y = 1.35;
    g.add(trunk, leaves);
    return g;
  }

  // -------- world scene --------------------------------------------
  function buildWorld(charCfg, name) {
    worldScene = new THREE.Scene();
    worldScene.fog = new THREE.Fog('#bcd4e6', 28, 80);

    // gradient sky dome (canvas texture, repainted by day/night)
    const skyCv = document.createElement('canvas'); skyCv.width = 8; skyCv.height = 256;
    skyTex = new THREE.CanvasTexture(skyCv);
    skyMesh = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 16),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }));
    skyMesh.userData.cv = skyCv; worldScene.add(skyMesh);
    paintSky('#a9d8f5', '#dfeffb');

    // soft sun glow
    const sunCv = document.createElement('canvas'); sunCv.width = sunCv.height = 128;
    const sctx = sunCv.getContext('2d');
    const sg = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    sg.addColorStop(0, 'rgba(255,250,230,0.95)'); sg.addColorStop(0.4, 'rgba(255,240,200,0.5)'); sg.addColorStop(1, 'rgba(255,240,200,0)');
    sctx.fillStyle = sg; sctx.fillRect(0, 0, 128, 128);
    sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(sunCv), transparent: true, depthWrite: false, fog: false }));
    sunGlow.scale.set(34, 34, 1); sunGlow.position.set(34, 34, -70); worldScene.add(sunGlow);

    hemi = new THREE.HemisphereLight('#ffffff', '#5a7a55', 1.05); worldScene.add(hemi);
    sun = new THREE.DirectionalLight('#fff6e0', 0.95); sun.position.set(14, 24, 10); worldScene.add(sun);
    const fill = new THREE.DirectionalLight('#cfe0ff', 0.3); fill.position.set(-12, 10, -8); worldScene.add(fill);

    // ground (soft radial gradient texture)
    const gCv = document.createElement('canvas'); gCv.width = gCv.height = 256;
    const gctx = gCv.getContext('2d');
    const gg = gctx.createRadialGradient(128, 128, 20, 128, 128, 140);
    gg.addColorStop(0, '#86c98a'); gg.addColorStop(0.6, '#72bd78'); gg.addColorStop(1, '#5fa869');
    gctx.fillStyle = gg; gctx.fillRect(0, 0, 256, 256);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 64),
      new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(gCv), roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2; worldScene.add(ground);
    // paths (cross)
    const pathMat = new THREE.MeshStandardMaterial({ color: '#d8c79a', roughness: 0.9 });
    const pathH = new THREE.Mesh(new THREE.PlaneGeometry(80, 4), pathMat);
    pathH.rotation.x = -Math.PI / 2; pathH.position.y = 0.01; worldScene.add(pathH);
    const pathV = new THREE.Mesh(new THREE.PlaneGeometry(4, 80), pathMat);
    pathV.rotation.x = -Math.PI / 2; pathV.position.y = 0.01; worldScene.add(pathV);

    // locations laid out around the square
    const LOC = [
      { id:'airport',  name:'Airport',         emoji:'✈️', x:-14, z:-10, color:'#60a5fa' },
      { id:'station',  name:'Train Station',   emoji:'🚉', x:14,  z:-10, color:'#34d399' },
      { id:'study',    name:'Study Room',      emoji:'📚', x:0,   z:-16, color:'#a78bfa' },
      { id:'shop',     name:'Shop',            emoji:'🛍️', x:-16, z:6,   color:'#f472b6' },
      { id:'quests',   name:'Quest Board',     emoji:'📋', x:0,   z:14,  color:'#fbbf24' },
      { id:'passport', name:'Passport Office', emoji:'🛂', x:16,  z:6,   color:'#22d3ee' },
      { id:'library',  name:'Library',         emoji:'🏛️', x:-9,  z:16,  color:'#c084fc' },
      { id:'cafe',     name:'Cafe',            emoji:'☕', x:9,   z:16,  color:'#d97706' },
      { id:'friends',  name:'Friends Plaza',   emoji:'🤝', x:0,   z:0,   color:'#f87171' },
    ];
    locations = [];
    LOC.forEach((l) => {
      const grp = new THREE.Group();
      const h = 2.2 + Math.random() * 1.2;
      const bld = new THREE.Mesh(new THREE.BoxGeometry(2.4, h, 2.4),
        new THREE.MeshStandardMaterial({ color: l.color, roughness: 0.7 }));
      bld.position.y = h / 2;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.0, 4),
        new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7 }));
      roof.position.y = h + 0.5; roof.rotation.y = Math.PI / 4;
      // glow ring
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.3, 24),
        new THREE.MeshBasicMaterial({ color: l.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02;
      const emo = makeLabel(l.emoji, { size: 44, scale: 1.4 }); emo.position.y = h + 1.6;
      const lbl = makeLabel(l.name, { color: '#fff', bg: 'rgba(20,20,40,0.85)', size: 24, scale: 2.4 });
      lbl.position.y = h + 1.1;
      grp.add(bld, roof, ring, emo, lbl);
      grp.position.set(l.x, 0, l.z);
      worldScene.add(grp);
      locations.push({ ...l, group: grp, ring });
    });

    // scatter trees & rocks
    for (let i = 0; i < 40; i++) {
      const tr = makeTree();
      const a = Math.random() * Math.PI * 2, r = 24 + Math.random() * 30;
      tr.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      const s = 0.7 + Math.random() * 0.8; tr.scale.set(s, s, s);
      worldScene.add(tr);
    }

    // player
    player = buildCharacter(charCfg, name);
    player.position.set(0, 0, 8);
    worldScene.add(player);

    worldCam = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
    worldCam.position.set(0, 7, 16);
    worldCam.lookAt(0, 1, 8);
  }

  // friend characters wandering the world
  let worldFriends = [];
  function setWorldFriends(list) {
    worldFriends.forEach(f => worldScene.remove(f.group));
    worldFriends = [];
    if (!worldScene) return;
    (list || []).forEach((f, i) => {
      const g = buildCharacter(f.char, f.name);
      const a = (i / Math.max(list.length, 1)) * Math.PI * 2;
      g.position.set(Math.cos(a) * 6, 0, Math.sin(a) * 6 + 2);
      g.userData.wander = { a, speed: 0.3 + Math.random() * 0.3, r: 5 + Math.random() * 3 };
      g.userData.state = 'walking';
      worldScene.add(g);
      worldFriends.push({ group: g, info: f });
    });
  }

  function paintSky(top, bottom) {
    if (!skyMesh) return;
    const cv = skyMesh.userData.cv, ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, cv.height);
    g.addColorStop(0, top); g.addColorStop(0.55, mix(top, bottom, 0.5)); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
    skyTex.needsUpdate = true;
  }
  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
    const gg = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
    const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
    return '#' + ((1 << 24) + (r << 16) + (gg << 8) + bl).toString(16).slice(1);
  }

  function updateDayNight() {
    if (!skyMesh) return;
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    let top, bottom, intensity, sunColor, fogColor, glow;
    if (h >= 5.5 && h < 9) { top = '#f9c79a'; bottom = '#ffe6cf'; intensity = 0.85; sunColor = '#ffe0b0'; fogColor = '#ffe3c8'; glow = '#ffd9a0'; }   // dawn
    else if (h >= 9 && h < 17) { top = '#7fbef0'; bottom = '#d8eefb'; intensity = 1.15; sunColor = '#fff6e0'; fogColor = '#cfe6f5'; glow = '#fff3cf'; } // day
    else if (h >= 17 && h < 20) { top = '#ef7d7a'; bottom = '#ffce8f'; intensity = 0.85; sunColor = '#ff9a5a'; fogColor = '#f6b487'; glow = '#ffb066'; } // dusk
    else { top = '#10173f'; bottom = '#3a2a66'; intensity = 0.5; sunColor = '#9aa8e0'; fogColor = '#171f44'; glow = '#3a3a7a'; }                          // night
    paintSky(top, bottom);
    if (worldScene.fog) worldScene.fog.color.set(fogColor);
    if (hemi) hemi.intensity = intensity;
    if (sun) { sun.intensity = intensity * 0.9; sun.color.set(sunColor); }
    if (sunGlow) sunGlow.material.color.set(glow);
  }

  // -------- study scene --------------------------------------------
  function buildStudyScene(bg, participants) {
    studyScene = new THREE.Scene();
    const c1 = new THREE.Color(bg.sky[0]), c2 = new THREE.Color(bg.sky[1]);
    studyScene.background = c2.clone();
    // gradient backdrop plane
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 256;
    const ctx = cv.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, bg.sky[0]); grad.addColorStop(1, bg.sky[1]);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 16, 256);
    const tex = new THREE.CanvasTexture(cv);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(60, 30),
      new THREE.MeshBasicMaterial({ map: tex }));
    back.position.set(0, 6, -12); studyScene.add(back);

    studyScene.add(new THREE.HemisphereLight('#ffffff', '#444466', 1.0));
    const dl = new THREE.DirectionalLight('#ffffff', 0.6); dl.position.set(4, 8, 6); studyScene.add(dl);

    // floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 24),
      new THREE.MeshStandardMaterial({ color: '#2a2a3e', roughness: 1 }));
    floor.rotation.x = -Math.PI / 2; studyScene.add(floor);

    // background-specific props
    addBackgroundProps(studyScene, bg);

    // seat participants in a row
    studyChars = [];
    const list = participants && participants.length ? participants : [{ char: {}, name: '', me: true }];
    const spacing = 2.2;
    const startX = -((list.length - 1) * spacing) / 2;
    list.forEach((p, i) => {
      const seat = new THREE.Group();
      // desk
      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.9),
        new THREE.MeshStandardMaterial({ color: '#8b5a2b', roughness: 0.8 }));
      desk.position.set(0, 0.95, 0.5);
      const legMat = new THREE.MeshStandardMaterial({ color: '#5a3a1b' });
      [[-0.7,0.15],[0.7,0.15],[-0.7,0.85],[0.7,0.85]].forEach(([x,z]) => {
        const lg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.95, 0.1), legMat);
        lg.position.set(x, 0.47, z); seat.add(lg);
      });
      // book on desk
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.36),
        new THREE.MeshStandardMaterial({ color: '#e2e8f0' }));
      book.position.set(0, 1.04, 0.5); book.rotation.x = -0.15; seat.add(book);
      // desk items
      if (p.desk && p.desk.indexOf('plant') >= 0) {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,0.16,6), new THREE.MeshStandardMaterial({color:'#b45309'}));
        pot.position.set(-0.6,1.08,0.4); const lf = new THREE.Mesh(new THREE.SphereGeometry(0.13,6,6), new THREE.MeshStandardMaterial({color:'#3fa34d'})); lf.position.y=0.14; pot.add(lf); seat.add(pot);
      }
      if (p.desk && p.desk.indexOf('lamp') >= 0) {
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.4,6), new THREE.MeshStandardMaterial({color:'#475569'}));
        lamp.position.set(0.6,1.2,0.4); const sh=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.14,8), new THREE.MeshStandardMaterial({color:'#fbbf24',emissive:'#fbbf24',emissiveIntensity:0.6})); sh.position.y=0.22; lamp.add(sh); seat.add(lamp);
        const pl = new THREE.PointLight('#ffd27f', 0.6, 4); pl.position.set(0.6,1.5,0.6); seat.add(pl);
      }
      if (p.desk && p.desk.indexOf('coffee') >= 0) {
        const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.06,0.12,8), new THREE.MeshStandardMaterial({color:'#ef4444'})); mug.position.set(0.45,1.07,0.65); seat.add(mug);
      }
      if (p.desk && p.desk.indexOf('globe') >= 0) {
        const gb = new THREE.Mesh(new THREE.SphereGeometry(0.1,10,10), new THREE.MeshStandardMaterial({color:'#3b82f6'})); gb.position.set(-0.5,1.12,0.6); seat.add(gb);
      }
      // chair
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.6),
        new THREE.MeshStandardMaterial({ color: '#475569' }));
      chair.position.set(0, 0.5, -0.2); seat.add(chair);

      const ch = buildCharacter(p.char, p.name);
      ch.position.set(0, 0.42, -0.2);
      ch.userData.state = p.me ? 'studying' : (Math.random() < 0.2 ? 'sleeping' : 'studying');
      ch.userData.me = !!p.me;
      seat.add(ch);
      seat.position.set(startX + i * spacing, 0, 0);
      studyScene.add(seat);
      studyChars.push({ group: ch, seat, info: p });
    });

    studyCam = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    studyCam.position.set(0, 2.6, 5.5);
    studyCam.lookAt(0, 1.2, 0);
  }

  function addBackgroundProps(scene, bg) {
    const M = (c, e) => new THREE.MeshStandardMaterial({ color: c, emissive: e || '#000', emissiveIntensity: e ? 0.5 : 0, roughness: 0.9 });
    if (bg.id === 'library' || bg.id === 'studyroom') {
      // bookshelves behind
      for (let s = -1; s <= 1; s += 2) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 0.6), M('#5a3a1b'));
        shelf.position.set(s * 7, 3, -8); scene.add(shelf);
        for (let r = 0; r < 5; r++) {
          const books = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 0.5),
            M(['#ef4444','#3b82f6','#10b981','#eab308','#8b5cf6'][r])); books.position.set(s*7, 1 + r*1.1, -7.8); scene.add(books);
        }
      }
    } else if (bg.id === 'cafe') {
      for (let i = 0; i < 4; i++) {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.1,12), M('#6b4423'));
        t.position.set(-6 + i*4, 0.9, -6); scene.add(t);
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.9,8), M('#3a2a1a')); leg.position.set(-6+i*4,0.45,-6); scene.add(leg);
      }
    } else if (bg.id === 'park') {
      for (let i = 0; i < 6; i++) { const tr = makeTree(); tr.position.set(-9 + i*3.5, 0, -7); const s=1.2+Math.random(); tr.scale.set(s,s,s); scene.add(tr); }
    } else if (bg.id === 'rooftop' || bg.id === 'spaceship') {
      // city lights / stars
      for (let i = 0; i < 120; i++) {
        const st = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), M('#fff', '#fff'));
        st.position.set((Math.random()-0.5)*40, Math.random()*14, -11 + Math.random()*2); scene.add(st);
      }
      if (bg.id === 'rooftop') for (let i=0;i<10;i++){ const b=new THREE.Mesh(new THREE.BoxGeometry(1.4,3+Math.random()*5,1.4),M('#1e293b')); b.position.set(-12+i*2.6,1.5,-9); scene.add(b);}
    } else if (bg.id === 'beach') {
      const water = new THREE.Mesh(new THREE.PlaneGeometry(40,16), M('#2dd4bf')); water.rotation.x=-Math.PI/2; water.position.set(0,0.02,-6); scene.add(water);
      const sun2 = new THREE.Mesh(new THREE.CircleGeometry(2,24), M('#fde68a','#fbbf24')); sun2.position.set(0,7,-11); scene.add(sun2);
    } else if (bg.id === 'train') {
      // window frames + passing scenery handled in animate via offset
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 0.3), M('#475569'));
      [-4,4].forEach(x=>{ const f=frame.clone(); f.position.set(x,3,-7); scene.add(f); });
    }
  }

  // -------- render loop --------------------------------------------
  let trainScroll = 0;
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (mode === 'world' && worldScene) {
      updatePlayer(dt);
      worldFriends.forEach(f => {
        const w = f.group.userData.wander; w.a += w.speed * dt;
        f.group.position.x = Math.cos(w.a) * w.r;
        f.group.position.z = Math.sin(w.a) * w.r + 2;
        f.group.rotation.y = -w.a + Math.PI / 2;
        animateChar(f.group, dt);
      });
      animateChar(player, dt);
      locations.forEach(l => { l.ring.material.opacity = 0.35 + Math.sin(clock.elapsedTime * 2) * 0.15; });
      renderer.render(worldScene, worldCam);
    } else if (mode === 'study' && studyScene) {
      studyChars.forEach(c => animateChar(c.group, dt));
      studyCam.position.x = Math.sin(clock.elapsedTime * 0.15) * 1.2;
      studyCam.lookAt(0, 1.2, 0);
      renderer.render(studyScene, studyCam);
    }
  }

  function updatePlayer(dt) {
    let mx = 0, mz = 0;
    if (keys['w'] || keys['arrowup']) mz -= 1;
    if (keys['s'] || keys['arrowdown']) mz += 1;
    if (keys['a'] || keys['arrowleft']) mx -= 1;
    if (keys['d'] || keys['arrowright']) mx += 1;
    mx += joy.x; mz += joy.y;
    const len = Math.hypot(mx, mz);
    const running = keys['shift'];
    if (len > 0.1) {
      mx /= len; mz /= len;
      const speed = (running ? 9 : 5) * dt;
      player.position.x = Math.max(-50, Math.min(50, player.position.x + mx * speed));
      player.position.z = Math.max(-50, Math.min(50, player.position.z + mz * speed));
      player.rotation.y = Math.atan2(mx, mz);
      player.userData.state = (running && len > 0.5) ? 'running' : 'walking';
    } else if (player.userData.state !== 'waving') {
      player.userData.state = 'idle';
    }
    // camera follow
    const camTarget = new THREE.Vector3(player.position.x, 7, player.position.z + 10);
    worldCam.position.lerp(camTarget, 0.08);
    worldCam.lookAt(player.position.x, 1.2, player.position.z);

    // proximity
    let near = null, best = 3.2;
    locations.forEach(l => {
      const d = Math.hypot(player.position.x - l.x, player.position.z - l.z);
      if (d < best) { best = d; near = l; }
    });
    if (near !== nearLocation) { nearLocation = near; if (onPrompt) onPrompt(near); }
  }

  // -------- public API ---------------------------------------------
  function init(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    clock = new THREE.Clock();
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    loop();
  }
  function onResize() {
    if (!renderer) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (worldCam) { worldCam.aspect = window.innerWidth / window.innerHeight; worldCam.updateProjectionMatrix(); }
    if (studyCam) { studyCam.aspect = window.innerWidth / window.innerHeight; studyCam.updateProjectionMatrix(); }
  }
  function enterWorld(charCfg, name) {
    buildWorld(charCfg, name);
    updateDayNight();
    mode = 'world';
  }
  function refreshPlayer(charCfg, name) {
    if (!worldScene) return;
    const pos = player.position.clone(), rot = player.rotation.y;
    worldScene.remove(player);
    player = buildCharacter(charCfg, name);
    player.position.copy(pos); player.rotation.y = rot;
    worldScene.add(player);
  }
  function enterStudy(bg, participants) { buildStudyScene(bg, participants); mode = 'study'; }
  function leaveStudy() { mode = worldScene ? 'world' : 'idle'; }
  function setJoystick(x, y) { joy.x = x; joy.y = y; }
  function setPrompt(cb) { onPrompt = cb; }
  function waveOnce() {
    if (!player) return;
    player.userData.state = 'waving';
    setTimeout(() => { if (player.userData.state === 'waving') player.userData.state = 'idle'; }, 2500);
  }
  // set state for "me" character in study scene + coins
  function setStudyMeState(s) { const me = studyChars.find(c => c.group.userData.me); if (me) me.group.userData.state = s; }
  function setStudyCoins(coins) {
    const me = studyChars.find(c => c.group.userData.me);
    if (me) setCharCoins(me.group, '⭐ ' + coins);
  }
  function setParticipantCoins(idx, coins) {
    if (studyChars[idx]) setCharCoins(studyChars[idx].group, '⭐ ' + coins);
  }
  function tickDayNight() { if (mode === 'world') updateDayNight(); }

  return {
    init, buildCharacter, enterWorld, refreshPlayer, enterStudy, leaveStudy,
    setJoystick, setPrompt, waveOnce, setWorldFriends,
    setStudyMeState, setStudyCoins, setParticipantCoins, tickDayNight,
    setState, makeLabel
  };
})();
