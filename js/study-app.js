/* ============================================================
   STUDYVERSE — application logic, UI & state
   ============================================================ */
(function () {
  const D = window.SV_DATA;
  const W = window.SV_WORLD;
  const $ = (id) => document.getElementById(id);
  const KEY = 'studyverse_v1';

  // ---------------- state ----------------
  function freshState() {
    return {
      onboarded: false,
      name: '',
      homeCityId: 'sf',
      character: { skin: '#ffdbac', hair: '#6b4423', outfit: '#14b8a6', accessory: null },
      coins: 30,
      totalMinutes: 0,
      miles: 0,
      streak: 0,
      lastStudyDate: null,
      visited: [],              // city ids visited (passport stamps with date)
      stamps: [],               // {id,name,country,flag,date,miles}
      unlockedBackgrounds: ['studyroom', 'library'],
      ownedItems: ['outfit_teal', 'hair_brown'],
      bgUsed: [],               // background ids used (for quest)
      claimedQuests: [],        // questId+period+key
      questProgress: {},        // metric counters per period bucket
      friends: [],              // bot ids added as friends
      blocked: [],
      day: { date: null, sessions: 0, newCities: 0, long90: 0, friendSessions: 0, chatPeople: [], bgUsedToday: [] },
      week: { key: null, minutes: 0, bgVariety: [] },
      lastSession: null,
    };
  }
  let S = load();
  function load() {
    try { const r = JSON.parse(localStorage.getItem(KEY)); if (r) return Object.assign(freshState(), r); } catch (e) {}
    return freshState();
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(S)); }

  // ---------------- date helpers ----------------
  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function weekKey() {
    const d = new Date(); const onejan = new Date(d.getFullYear(), 0, 1);
    const wk = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return d.getFullYear() + '-W' + wk;
  }
  function rollPeriods() {
    const t = todayStr(), wk = weekKey();
    if (S.day.date !== t) S.day = { date: t, sessions: 0, newCities: 0, long90: 0, friendSessions: 0, chatPeople: [], bgUsedToday: [] };
    if (S.week.key !== wk) S.week = { key: wk, minutes: 0, bgVariety: [] };
  }

  // ---------------- toast ----------------
  function toast(msg, emoji) {
    const c = $('toast-wrap');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = (emoji ? '<span class="toast-emoji">' + emoji + '</span>' : '') + '<span>' + msg + '</span>';
    c.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
  }
  function addCoins(n, reason) {
    S.coins += n; save(); updateHud();
    if (n > 0) toast('+' + n + ' coins' + (reason ? ' · ' + reason : ''), '⭐');
  }

  // ---------------- HUD ----------------
  function updateHud() {
    $('hud-coins').textContent = S.coins;
    $('hud-streak').textContent = S.streak;
    $('hud-miles').textContent = S.miles.toLocaleString();
  }

  // ---------------- generic panel ----------------
  function openPanel(title, bodyHtml, opts) {
    opts = opts || {};
    $('panel-title').textContent = title;
    $('panel-body').innerHTML = bodyHtml;
    $('panel').classList.add('open');
    $('panel').classList.toggle('wide', !!opts.wide);
    if (opts.onOpen) opts.onOpen();
  }
  function closePanel() { $('panel').classList.remove('open'); }

  // ---------------- onboarding ----------------
  function startOnboarding() {
    $('onboarding').classList.remove('hidden');
    obStep = 0; renderOnboarding();
  }
  let obStep = 0;
  let obDraft = null;
  function renderOnboarding() {
    const wrap = $('onboarding-card');
    if (obStep === 0) {
      obDraft = JSON.parse(JSON.stringify(S.character));
      wrap.innerHTML = `
        <div class="ob-emoji">🧳</div>
        <h1 class="ob-title">Welcome to <span class="grad">Studyverse</span></h1>
        <p class="ob-sub">A gamified study world. Earn coins, fly to new cities, and study with friends worldwide.</p>
        <label class="ob-label">What is your name?</label>
        <input id="ob-name" class="ob-input" placeholder="Type your name..." maxlength="18" />
        <button class="btn btn-primary btn-lg" id="ob-go">Let's Go ✈️</button>`;
      $('ob-name').focus();
      $('ob-name').addEventListener('keydown', e => { if (e.key === 'Enter') $('ob-go').click(); });
      $('ob-go').onclick = () => {
        const n = $('ob-name').value.trim();
        if (!n) { $('ob-name').classList.add('shake'); setTimeout(() => $('ob-name').classList.remove('shake'), 400); return; }
        S.name = n; obStep = 1; renderOnboarding();
      };
    } else if (obStep === 1) {
      wrap.innerHTML = `
        <h2 class="ob-title-sm">Hi ${esc(S.name)}! 👋</h2>
        <p class="ob-sub">Customize your character.</p>
        <div id="ob-preview" class="ob-preview"></div>
        <div class="ob-customizer" id="ob-customizer"></div>
        <button class="btn btn-primary btn-lg" id="ob-next">Looks Great →</button>`;
      renderCustomizer($('ob-customizer'), obDraft, () => mountPreview($('ob-preview'), obDraft, S.name));
      mountPreview($('ob-preview'), obDraft, S.name);
      $('ob-next').onclick = () => { S.character = obDraft; obStep = 2; renderOnboarding(); };
    } else if (obStep === 2) {
      wrap.innerHTML = `
        <div class="ob-emoji">🚪</div>
        <h2 class="ob-title-sm">Stepping into the world...</h2>
        <p class="ob-sub">${esc(S.name)} waves and walks through the front door into Studyverse.</p>
        <div id="ob-preview2" class="ob-preview"></div>
        <div class="ob-walk-bar"><div class="ob-walk-fill" id="ob-walk-fill"></div></div>`;
      mountPreview($('ob-preview2'), S.character, S.name, true);
      setTimeout(() => $('ob-walk-fill').style.width = '100%', 100);
      setTimeout(() => finishOnboarding(), 2600);
    }
  }
  function finishOnboarding() {
    S.onboarded = true; save();
    $('onboarding').classList.add('hidden');
    enterMainWorld();
    toast('Welcome to Studyverse, ' + S.name + '!', '🎉');
  }

  // small standalone preview using a tiny three renderer
  let previewers = [];
  function mountPreview(container, cfg, name, wave) {
    container.innerHTML = '';
    const cv = document.createElement('canvas');
    cv.width = container.clientWidth || 260; cv.height = 220;
    container.appendChild(cv);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#445', 1.1));
    const dl = new THREE.DirectionalLight('#fff', 0.7); dl.position.set(2, 4, 3); scene.add(dl);
    const ch = W.buildCharacter(cfg, name);
    scene.add(ch);
    const cam = new THREE.PerspectiveCamera(45, cv.width / cv.height, 0.1, 50);
    cam.position.set(0, 1.5, 3.6); cam.lookAt(0, 1.0, 0);
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.setSize(cv.width, cv.height, false);
    let t = 0, raf;
    ch.userData.state = wave ? 'waving' : 'idle';
    function spin() {
      raf = requestAnimationFrame(spin); t += 0.016;
      ch.rotation.y = Math.sin(t * 0.6) * 0.5;
      W.setState && W.setState(ch, ch.userData.state);
      animatePreview(ch, 0.016);
      r.render(scene, cam);
    }
    spin();
    container._cleanup = () => { cancelAnimationFrame(raf); r.dispose(); };
  }
  function animatePreview(g, dt) {
    g.userData.t = (g.userData.t || 0) + dt;
    const p = g.userData.parts, t = g.userData.t;
    if (g.userData.state === 'waving') { p.rArm.rotation.z = -2.4; p.rArm.rotation.x = Math.sin(t * 10) * 0.3; }
    else p.body.position.y = 0.85 + Math.sin(t * 2) * 0.03;
  }

  // ---------------- character customizer (shared) ----------------
  function renderCustomizer(container, draft, onChange) {
    const skins = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5a3a1a'];
    const ownedHair = D.SHOP.filter(i => i.type === 'hair' && S.ownedItems.includes(i.id));
    const ownedOutfit = D.SHOP.filter(i => i.type === 'outfit' && S.ownedItems.includes(i.id));
    const ownedAcc = D.SHOP.filter(i => i.type === 'accessory' && S.ownedItems.includes(i.id));
    function swatches(list, key, getVal, getLabel) {
      return list.map(it => {
        const val = getVal(it);
        const sel = draft[key] === val ? 'sel' : '';
        return `<button class="swatch ${sel}" data-key="${key}" data-val="${val}" style="background:${typeof val==='string'&&val[0]==='#'?val:'#2a2a3e'}">${getLabel ? getLabel(it) : ''}</button>`;
      }).join('');
    }
    container.innerHTML = `
      <div class="cz-row"><span class="cz-lbl">Skin</span><div class="cz-swatches">${swatches(skins.map(s=>({v:s})),'skin',i=>i.v)}</div></div>
      <div class="cz-row"><span class="cz-lbl">Hair</span><div class="cz-swatches">${swatches(ownedHair,'hair',i=>i.value)}</div></div>
      <div class="cz-row"><span class="cz-lbl">Outfit</span><div class="cz-swatches">${swatches(ownedOutfit,'outfit',i=>i.value)}</div></div>
      <div class="cz-row"><span class="cz-lbl">Extra</span><div class="cz-swatches">
        <button class="swatch ${!draft.accessory?'sel':''}" data-key="accessory" data-val="">none</button>
        ${ownedAcc.map(it=>`<button class="swatch ${draft.accessory===it.value?'sel':''}" data-key="accessory" data-val="${it.value}">${it.emoji}</button>`).join('')}
      </div></div>`;
    container.querySelectorAll('.swatch').forEach(b => b.onclick = () => {
      const k = b.dataset.key; let v = b.dataset.val; if (v === '') v = null;
      draft[k] = v;
      container.querySelectorAll('[data-key="' + k + '"]').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      onChange && onChange();
    });
  }

  // ---------------- main world entry ----------------
  function enterMainWorld() {
    $('hud').classList.remove('hidden');
    $('mobile-controls').classList.toggle('hidden', !isTouch());
    W.enterWorld(S.character, S.name);
    W.setWorldFriends(friendObjects().filter(f => f.online).slice(0, 4));
    W.setPrompt(onProximity);
    updateHud();
    setTimeout(() => W.waveOnce(), 600);
  }
  function onProximity(loc) {
    const p = $('enter-prompt');
    if (loc) { p.classList.remove('hidden'); $('enter-prompt-name').textContent = loc.name; p.dataset.loc = loc.id; }
    else p.classList.add('hidden');
  }
  function enterLocation(id) {
    onProximity(null);
    switch (id) {
      case 'airport': openTravelPanel('plane'); break;
      case 'station': openTravelPanel('train'); break;
      case 'study': openTravelPanel('any'); break;
      case 'library': openTravelPanel('any', 'library'); break;
      case 'cafe': openTravelPanel('any', 'cafe'); break;
      case 'shop': openShop(); break;
      case 'quests': openQuests(); break;
      case 'passport': openPassport(); break;
      case 'friends': openFriends(); break;
    }
  }

  // ---------------- travel / session setup ----------------
  let sessionSetup = { duration: 25, destination: null, background: 'studyroom', mode: 'plane', pomodoro: false, participants: null };
  function homeCity() { return D.HOME_CITIES.find(c => c.id === S.homeCityId) || D.HOME_CITIES[0]; }

  function openTravelPanel(mode, presetBg) {
    rollPeriods();
    sessionSetup = { duration: 25, destination: null, background: presetBg || 'studyroom', mode: mode === 'train' ? 'train' : 'plane', pomodoro: false, participants: null };
    const durations = [
      { m: 25, label: '25 min', tier: 'short', note: 'Short hop' },
      { m: 50, label: '50 min', tier: 'medium', note: 'Medium trip' },
      { m: 90, label: '90 min', tier: 'long', note: 'Long haul' },
      { m: 0, label: 'Custom', tier: 'any', note: 'Your call' },
    ];
    const html = `
      <div class="travel-step"><h3 class="step-h">1 · Choose a duration</h3>
        <div class="dur-grid" id="dur-grid">
          ${durations.map(d => `<button class="dur-card ${d.m===25?'sel':''}" data-m="${d.m}" data-tier="${d.tier}">
            <span class="dur-min">${d.label}</span><span class="dur-note">${d.note}</span></button>`).join('')}
        </div>
        <div id="custom-wrap" class="custom-wrap hidden">
          <input type="number" id="custom-min" min="5" max="240" value="60" class="ob-input" /> <span>minutes</span>
        </div>
        <label class="pom-toggle"><input type="checkbox" id="pom-check"/> Pomodoro mode (25 work / 5 break auto-cycle)</label>
      </div>
      <div class="travel-step"><h3 class="step-h">2 · Pick your destination ${homeCity().name} → ?</h3>
        <div class="dest-list" id="dest-list"></div>
      </div>
      <div class="travel-step"><h3 class="step-h">3 · Choose your study environment</h3>
        <div class="bg-list" id="bg-list"></div>
      </div>
      <button class="btn btn-primary btn-lg" id="start-session-btn" disabled>Board & Start Studying ✈️</button>`;
    openPanel('Plan Your Flight', html, { wide: true });
    bindTravelPanel();
  }

  function bindTravelPanel() {
    function refreshDest() {
      const tier = sessionSetup.duration >= 90 ? 'long' : sessionSetup.duration >= 50 ? 'medium' : sessionSetup.duration > 0 && sessionSetup.duration < 25 ? 'short' : sessionSetup.duration >= 25 ? 'short' : 'long';
      let pool = D.DESTINATIONS.filter(d => {
        if (sessionSetup.mode === 'train') return d.mode === 'train' || d.tier !== 'long';
        return true;
      });
      // suggest by tier but allow all
      const list = $('dest-list');
      list.innerHTML = pool.map(d => {
        const visited = S.visited.includes(d.id);
        const match = d.tier === tier;
        return `<button class="dest-card ${sessionSetup.destination===d.id?'sel':''} ${match?'rec':''}" data-id="${d.id}">
          <span class="dest-flag">${d.flag}</span>
          <span class="dest-info"><span class="dest-name">${d.name}${visited?' <span class="dest-stamp">✓</span>':''}</span>
          <span class="dest-meta">${d.country} · ${d.miles.toLocaleString()} mi · ${d.mode==='train'?'🚆':'✈️'}${match?' · recommended':''}</span></span>
          ${!visited?'<span class="dest-bonus">+15 🎁</span>':''}</button>`;
      }).join('');
      list.querySelectorAll('.dest-card').forEach(b => b.onclick = () => {
        sessionSetup.destination = b.dataset.id;
        list.querySelectorAll('.dest-card').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel'); checkStartReady();
      });
    }
    function refreshBg() {
      const list = $('bg-list');
      list.innerHTML = D.BACKGROUNDS.map(b => {
        const locked = !isBgUnlocked(b.id);
        return `<button class="bg-card ${sessionSetup.background===b.id?'sel':''} ${locked?'locked':''}" data-id="${b.id}" ${locked?'disabled':''}>
          <span class="bg-emoji">${b.emoji}</span>
          <span class="bg-name">${b.name}</span>
          <span class="bg-amb">${b.ambient}</span>
          ${locked?`<span class="bg-lock">🔒 ${bgUnlockText(b)}</span>`:'<span class="bg-prev" data-prev="'+b.id+'">preview</span>'}</button>`;
      }).join('');
      list.querySelectorAll('.bg-card').forEach(b => b.onclick = (e) => {
        if (b.classList.contains('locked')) return;
        if (e.target.dataset.prev) { previewBackground(e.target.dataset.prev); return; }
        sessionSetup.background = b.dataset.id;
        list.querySelectorAll('.bg-card').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
      });
    }
    $('dur-grid').querySelectorAll('.dur-card').forEach(b => b.onclick = () => {
      $('dur-grid').querySelectorAll('.dur-card').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      const m = +b.dataset.m;
      $('custom-wrap').classList.toggle('hidden', m !== 0);
      sessionSetup.duration = m === 0 ? (+$('custom-min').value || 60) : m;
      refreshDest(); checkStartReady();
    });
    $('custom-min').addEventListener('input', e => { sessionSetup.duration = +e.target.value || 60; refreshDest(); });
    $('pom-check').onchange = e => sessionSetup.pomodoro = e.target.checked;
    function checkStartReady() { $('start-session-btn').disabled = !sessionSetup.destination; }
    $('start-session-btn').onclick = () => {
      if (!sessionSetup.destination) return;
      closePanel(); beginSession();
    };
    refreshDest(); refreshBg();
  }

  function previewBackground(id) {
    const b = D.BACKGROUNDS.find(x => x.id === id);
    openPanel('Preview · ' + b.name, `
      <div class="bg-preview" style="background:linear-gradient(160deg,${b.sky[0]},${b.sky[1]})">
        <div class="bg-preview-emoji">${b.emoji}</div>
        <div class="bg-preview-name">${b.name}</div>
        <div class="bg-preview-amb">🔊 ${b.ambient}</div>
        <p class="bg-preview-desc">${b.desc}</p>
      </div>
      <button class="btn btn-secondary btn-full" onclick="SV.backTravel()">← Back</button>`);
  }
  function backTravel() { closePanel(); openTravelPanel(sessionSetup.mode); }

  function isBgUnlocked(id) {
    if (S.unlockedBackgrounds.includes(id)) return true;
    const b = D.BACKGROUNDS.find(x => x.id === id);
    if (!b || !b.unlock) return true;
    if (b.unlock.coins != null && S.coins >= b.unlock.coins) return true;
    if (b.unlock.visit && S.visited.includes(b.unlock.visit)) return true;
    if (b.unlock.streak != null && S.streak >= b.unlock.streak) return true;
    return false;
  }
  function bgUnlockText(b) {
    if (!b.unlock) return '';
    if (b.unlock.coins != null) return b.unlock.coins + ' coins';
    if (b.unlock.visit) { const c = D.DESTINATIONS.find(d => d.id === b.unlock.visit); return 'visit ' + (c ? c.name : b.unlock.visit); }
    if (b.unlock.streak != null) return b.unlock.streak + '-day streak';
    return '';
  }

  // ---------------- study session ----------------
  let session = null;
  function beginSession(participants) {
    rollPeriods();
    const dest = D.DESTINATIONS.find(d => d.id === sessionSetup.destination);
    const bg = D.BACKGROUNDS.find(b => b.id === sessionSetup.background);
    const me = { char: S.character, name: S.name, me: true, desk: ownedDeskItems(), coins: 0 };
    const parts = participants ? [me].concat(participants) : [me];
    session = {
      dest, bg, duration: sessionSetup.duration, pomodoro: sessionSetup.pomodoro,
      total: sessionSetup.duration * 60, left: sessionSetup.duration * 60,
      earnedMinutes: 0, coins: 0, running: true, parts,
      lastActivity: Date.now(), idle: false,
      pomPhase: 'work', pomLeft: 25 * 60, focusMode: false, started: Date.now(),
    };
    W.enterStudy(bg, parts);
    $('hud').classList.add('hidden');
    $('mobile-controls').classList.add('hidden');
    onProximity(null);
    $('study-ui').classList.remove('hidden');
    buildStudyUI();
    startAmbient(bg.ambient);
    sessionTick(); // immediate render
    if (session.timer) clearInterval(session.timer);
    session.timer = setInterval(sessionTick, 1000);
    // simulate participants' coins
    session.parts.forEach((p, i) => { if (!p.me) p.coins = 0; });
  }

  function buildStudyUI() {
    const s = session;
    $('study-ui').innerHTML = `
      <div class="study-top">
        <div class="study-route">
          <span class="sr-city">${esc(homeCity().name)}</span>
          <span class="sr-line">${s.dest.mode === 'train' ? '🚆' : '✈️'} <span class="sr-dots">·····</span></span>
          <span class="sr-city">${s.dest.flag} ${esc(s.dest.name)}</span>
        </div>
        <canvas id="route-map" width="320" height="120"></canvas>
        <div class="study-bg-tag">${s.bg.emoji} ${s.bg.name} · 🔊 ${s.bg.ambient}</div>
      </div>
      <div class="study-center">
        <div class="study-timer" id="study-timer">00:00</div>
        <div class="study-phase" id="study-phase"></div>
        <div class="study-coins"><span id="study-coin-val">0</span> ⭐ coins this session</div>
        <div class="study-progress"><div class="study-progress-fill" id="study-prog"></div></div>
      </div>
      <div class="study-participants" id="study-participants"></div>
      <div class="study-controls">
        <button class="btn btn-secondary" id="btn-pause">⏸ Pause</button>
        ${s.parts.length > 1 ? '<button class="btn btn-secondary" id="btn-focus">🔇 Focus Mode</button>' : ''}
        <button class="btn btn-secondary" id="btn-study-chat">💬 Chat</button>
        <button class="btn btn-danger" id="btn-end">⏹ End Session</button>
      </div>`;
    $('btn-pause').onclick = togglePause;
    $('btn-end').onclick = () => endSession(false);
    $('btn-study-chat').onclick = () => toggleChat(true);
    const fb = $('btn-focus'); if (fb) fb.onclick = toggleFocus;
    renderParticipants();
    drawRouteMap(0);
    bindActivity();
  }
  function renderParticipants() {
    const wrap = $('study-participants'); if (!wrap) return;
    wrap.innerHTML = session.parts.map((p, i) => `
      <div class="part-chip ${p.me ? 'me' : ''}">
        <span class="part-dot" style="background:${p.char.outfit || '#14b8a6'}"></span>
        <span class="part-name">${esc(p.name || 'You')}${p.me ? ' (you)' : ''}</span>
        <span class="part-coins" id="pc-${i}">${p.coins} ⭐</span>
      </div>`).join('');
  }

  let activityBound = false;
  function bindActivity() {
    if (activityBound) return; activityBound = true;
    ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'].forEach(ev =>
      window.addEventListener(ev, markActive, { passive: true }));
  }
  function markActive() { if (session) { session.lastActivity = Date.now(); if (session.idle) { session.idle = false; W.setStudyMeState('studying'); } } }

  function sessionTick() {
    const s = session; if (!s) return;
    if (s.running) {
      s.left--;
      // idle detection
      const idleFor = (Date.now() - s.lastActivity) / 1000;
      if (idleFor > 18 && !s.idle) { s.idle = true; W.setStudyMeState('sleeping'); toast(S.name + ' dozed off... move to wake up!', '💤'); }
      // coin per completed minute
      const elapsed = s.total - s.left;
      const newMinutes = Math.floor(elapsed / 60);
      if (newMinutes > s.earnedMinutes) {
        const gained = newMinutes - s.earnedMinutes;
        s.earnedMinutes = newMinutes; s.coins += gained;
        s.parts[0].coins = s.coins;
        W.setStudyCoins(s.coins);
        // simulate others
        s.parts.forEach((p, i) => { if (!p.me) { p.coins += gained; W.setParticipantCoins(i, p.coins); } });
        updateStudyCoins();
      }
      // pomodoro phase cycling
      if (s.pomodoro) {
        s.pomLeft--;
        if (s.pomLeft <= 0) {
          if (s.pomPhase === 'work') { s.pomPhase = 'break'; s.pomLeft = 5 * 60; toast('Break time! 5 min ☕', '☕'); W.setStudyMeState('idle'); if (s.focusMode) toggleFocus(); }
          else { s.pomPhase = 'work'; s.pomLeft = 25 * 60; toast('Back to work! 💪', '💪'); W.setStudyMeState('studying'); }
        }
      }
      if (s.left <= 0) { endSession(true); return; }
    }
    // render
    $('study-timer').textContent = fmt(s.left);
    const phaseEl = $('study-phase');
    if (s.pomodoro) phaseEl.textContent = (s.pomPhase === 'work' ? '📖 Focus · ' : '☕ Break · ') + fmt(s.pomLeft);
    else phaseEl.textContent = s.running ? '📖 Studying' : '⏸ Paused';
    $('study-prog').style.width = (100 * (1 - s.left / s.total)) + '%';
    drawRouteMap(1 - s.left / s.total);
  }
  function updateStudyCoins() {
    $('study-coin-val').textContent = session.coins;
    session.parts.forEach((p, i) => { const el = $('pc-' + i); if (el) el.textContent = p.coins + ' ⭐'; });
  }
  function togglePause() {
    session.running = !session.running;
    $('btn-pause').innerHTML = session.running ? '⏸ Pause' : '▶ Resume';
    W.setStudyMeState(session.running ? 'studying' : 'idle');
  }
  function toggleFocus() {
    session.focusMode = !session.focusMode;
    const b = $('btn-focus'); if (b) b.innerHTML = session.focusMode ? '🔊 Unmute' : '🔇 Focus Mode';
    toast(session.focusMode ? 'Focus Mode on — chat muted' : 'Chat unmuted', session.focusMode ? '🔇' : '🔊');
    if (session.focusMode) toggleChat(false);
  }

  function drawRouteMap(progress) {
    const cv = $('route-map'); if (!cv) return;
    const ctx = cv.getContext('2d'); const w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    // backdrop
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; roundRectC(ctx, 0, 0, w, h, 12); ctx.fill();
    const x1 = 40, y1 = h - 30, x2 = w - 40, y2 = 30;
    // dashed route
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(w / 2, y2 - 25, x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    // endpoints
    ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(x1, y1, 5, 0, 7); ctx.fill();
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(x2, y2, 5, 0, 7); ctx.fill();
    // moving vehicle along quad bezier
    const t = Math.max(0, Math.min(1, progress));
    const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * (w / 2) + t * t * x2;
    const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * (y2 - 25) + t * t * y2;
    ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(session.dest.mode === 'train' ? '🚆' : '✈️', bx, by);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '11px system-ui'; ctx.textAlign = 'left';
    ctx.fillText(homeCity().name, x1 - 30, y1 + 18);
    ctx.textAlign = 'right'; ctx.fillText(session.dest.name, x2 + 25, y2 - 14);
  }

  function endSession(completed) {
    const s = session; if (!s) return;
    clearInterval(s.timer);
    stopAmbient();
    window.removeEventListener('mousemove', markActive);
    const minutes = s.earnedMinutes;
    const coins = s.coins;
    // apply rewards
    S.coins += coins;
    S.totalMinutes += minutes;
    rollPeriods();
    S.day.sessions += 1;
    S.week.minutes += minutes;
    if (s.duration >= 90 && completed) S.day.long90 += 1;
    if (s.parts.length > 1) S.day.friendSessions += 1;
    // background variety
    if (!S.week.bgVariety.includes(s.bg.id)) S.week.bgVariety.push(s.bg.id);
    if (!S.day.bgUsedToday.includes(s.bg.id)) S.day.bgUsedToday.push(s.bg.id);
    if (!S.bgUsed.includes(s.bg.id)) S.bgUsed.push(s.bg.id);
    // travel stamp
    let bonus = 0, newCity = false;
    if (minutes > 0) {
      if (!S.visited.includes(s.dest.id)) {
        S.visited.push(s.dest.id); newCity = true; S.day.newCities += 1; bonus += 15;
        S.stamps.push({ id: s.dest.id, name: s.dest.name, country: s.dest.country, flag: s.dest.flag, date: todayStr(), miles: s.dest.miles });
      }
      S.miles += s.dest.miles;
    }
    // streak
    if (minutes > 0) updateStreak();
    S.coins += bonus;
    S.lastSession = { dest: s.dest.name, minutes, coins: coins + bonus, date: todayStr() };
    checkBackgroundUnlocks();
    save();
    // results screen
    showResults({ minutes, coins, bonus, newCity, dest: s.dest, completed, parts: s.parts });
    session = null;
  }

  function updateStreak() {
    const t = todayStr();
    if (S.lastStudyDate === t) return;
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (S.lastStudyDate === y) S.streak += 1; else S.streak = 1;
    S.lastStudyDate = t;
  }
  function checkBackgroundUnlocks() {
    D.BACKGROUNDS.forEach(b => {
      if (!S.unlockedBackgrounds.includes(b.id) && isBgUnlocked(b.id)) {
        S.unlockedBackgrounds.push(b.id);
        toast('New environment unlocked: ' + b.name, b.emoji);
      }
    });
  }

  function showResults(r) {
    $('study-ui').innerHTML = `
      <div class="results">
        <div class="results-card">
          <div class="results-emoji">${r.completed ? '🎉' : '👍'}</div>
          <h2>${r.completed ? 'Session Complete!' : 'Session Ended'}</h2>
          <p class="results-sub">${r.minutes > 0 ? 'You arrived in ' + r.dest.flag + ' ' + r.dest.name + '!' : 'No minutes completed.'}</p>
          <div class="results-stats">
            <div class="rstat"><span class="rstat-v">${r.minutes}</span><span class="rstat-l">minutes</span></div>
            <div class="rstat"><span class="rstat-v">+${r.coins}</span><span class="rstat-l">coins</span></div>
            ${r.bonus ? `<div class="rstat"><span class="rstat-v">+${r.bonus}</span><span class="rstat-l">new city bonus</span></div>` : ''}
            ${r.newCity ? `<div class="rstat"><span class="rstat-v">🛂</span><span class="rstat-l">stamp earned</span></div>` : ''}
          </div>
          ${r.parts.length > 1 ? `<div class="results-group">👥 Studied with ${r.parts.length - 1} friend(s) · group streak +1</div>` : ''}
          <button class="btn btn-primary btn-lg" id="results-done">Back to World 🌍</button>
        </div>
      </div>`;
    $('results-done').onclick = () => {
      $('study-ui').classList.add('hidden');
      W.leaveStudy();
      $('hud').classList.remove('hidden');
      $('mobile-controls').classList.toggle('hidden', !isTouch());
      updateHud();
    };
  }

  // ---------------- shop ----------------
  function openShop() {
    const groups = [
      { key: 'outfit', label: '🧥 Outfits' }, { key: 'hair', label: '💇 Hairstyles' },
      { key: 'accessory', label: '👓 Accessories' }, { key: 'desk', label: '🪴 Desk Items' },
      { key: 'background', label: '🌅 Backgrounds' },
    ];
    const html = `<div class="shop-balance">Balance: <b>${S.coins} ⭐</b></div>` + groups.map(g => `
      <h3 class="step-h">${g.label}</h3>
      <div class="shop-grid">${D.SHOP.filter(i => i.type === g.key).map(shopCard).join('')}</div>`).join('');
    openPanel('Shop', html, { wide: true });
    $('panel-body').querySelectorAll('.shop-buy').forEach(b => b.onclick = () => buyItem(b.dataset.id));
  }
  function shopCard(i) {
    const owned = S.ownedItems.includes(i.id) || (i.type === 'background' && S.unlockedBackgrounds.includes(i.value));
    const can = S.coins >= i.price;
    return `<div class="shop-item ${owned ? 'owned' : ''}">
      <div class="shop-emoji" style="${i.value && i.value[0] === '#' ? 'background:' + i.value : ''}">${i.emoji}</div>
      <div class="shop-name">${i.name}</div>
      <div class="shop-price">${i.price === 0 ? 'Free' : i.price + ' ⭐'}</div>
      ${owned ? '<button class="btn btn-tiny" disabled>Owned</button>'
        : `<button class="btn btn-tiny btn-primary shop-buy" data-id="${i.id}" ${can ? '' : 'disabled'}>${can ? 'Buy' : 'Need more'}</button>`}
    </div>`;
  }
  function buyItem(id) {
    const i = D.SHOP.find(x => x.id === id); if (!i) return;
    if (S.coins < i.price) return;
    S.coins -= i.price;
    if (i.type === 'background') { if (!S.unlockedBackgrounds.includes(i.value)) S.unlockedBackgrounds.push(i.value); }
    else S.ownedItems.push(i.id);
    // auto-equip wearables
    if (i.type === 'outfit') S.character.outfit = i.value;
    if (i.type === 'hair') S.character.hair = i.value;
    if (i.type === 'accessory') S.character.accessory = i.value;
    save(); updateHud();
    if (['outfit', 'hair', 'accessory'].includes(i.type)) W.refreshPlayer(S.character, S.name);
    toast('Purchased ' + i.name + (['outfit','hair','accessory'].includes(i.type) ? ' — equipped!' : ''), i.emoji);
    openShop();
  }
  function ownedDeskItems() {
    return D.SHOP.filter(i => i.type === 'desk' && S.ownedItems.includes(i.id)).map(i => i.value);
  }

  // ---------------- quests ----------------
  function questValue(q) {
    rollPeriods();
    switch (q.metric) {
      case 'sessionsToday': return S.day.sessions;
      case 'weekMinutes': return S.week.minutes;
      case 'streak': return S.streak;
      case 'newCitiesToday': return S.day.newCities;
      case 'long90Today': return S.day.long90;
      case 'friendSessionsToday': return S.day.friendSessions;
      case 'chatPeopleToday': return S.day.chatPeople.length;
      case 'bgVariety': return S.week.bgVariety.length;
      case 'countriesVisited': return new Set(S.stamps.map(s => s.country)).size;
      default: return 0;
    }
  }
  function questClaimKey(q) { return q.id + '|' + (q.period === 'daily' ? S.day.date : q.period === 'weekly' ? S.week.key : 'all'); }
  function openQuests() {
    const html = `<p class="quest-intro">Complete quests for bonus coins. Daily & weekly quests reset automatically.</p>` +
      D.QUESTS.map(q => {
        const v = Math.min(questValue(q), q.goal);
        const done = v >= q.goal;
        const claimed = S.claimedQuests.includes(questClaimKey(q));
        const pct = Math.round((v / q.goal) * 100);
        return `<div class="quest-card ${done ? 'done' : ''}">
          <div class="quest-top"><span class="quest-period ${q.period}">${q.period}</span>
            <span class="quest-reward">+${q.reward} ⭐</span></div>
          <div class="quest-text">${q.text}</div>
          <div class="quest-bar"><div class="quest-fill" style="width:${pct}%"></div></div>
          <div class="quest-bottom"><span>${v} / ${q.goal}</span>
            ${claimed ? '<span class="quest-claimed">✓ Claimed</span>'
              : done ? `<button class="btn btn-tiny btn-primary quest-claim" data-id="${q.id}">Claim</button>`
              : '<span class="quest-progress-lbl">in progress</span>'}</div>
        </div>`;
      }).join('');
    openPanel('Quest Board', html, { wide: true });
    $('panel-body').querySelectorAll('.quest-claim').forEach(b => b.onclick = () => claimQuest(b.dataset.id));
  }
  function claimQuest(id) {
    const q = D.QUESTS.find(x => x.id === id); if (!q) return;
    if (questValue(q) < q.goal) return;
    const k = questClaimKey(q);
    if (S.claimedQuests.includes(k)) return;
    S.claimedQuests.push(k); S.coins += q.reward; save(); updateHud();
    toast('Quest complete! +' + q.reward + ' coins', '🏆');
    openQuests();
  }

  // ---------------- passport ----------------
  function openPassport() {
    const countries = new Set(S.stamps.map(s => s.country)).size;
    const html = `
      <div class="passport-head">
        <div class="pp-stat"><b>${S.stamps.length}</b><span>cities</span></div>
        <div class="pp-stat"><b>${countries}</b><span>countries</span></div>
        <div class="pp-stat"><b>${S.miles.toLocaleString()}</b><span>miles</span></div>
      </div>
      <div class="passport-map" id="pp-map"><canvas id="pp-canvas" width="640" height="320"></canvas></div>
      <h3 class="step-h">Stamps</h3>
      <div class="stamp-grid">${S.stamps.length ? S.stamps.map(s => `
        <div class="stamp"><span class="stamp-flag">${s.flag}</span><span class="stamp-name">${s.name}</span>
        <span class="stamp-date">${s.date}</span></div>`).join('') : '<p class="muted">No stamps yet — complete a flight to earn your first!</p>'}</div>`;
    openPanel('Passport Office', html, { wide: true, onOpen: drawPassportMap });
  }
  function drawPassportMap() {
    const cv = $('pp-canvas'); if (!cv) return;
    const ctx = cv.getContext('2d'); const w = cv.width, h = cv.height;
    ctx.fillStyle = '#1b2440'; ctx.fillRect(0, 0, w, h);
    // crude continents grid dots
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let x = 0; x < w; x += 16) for (let y = 0; y < h; y += 16) { ctx.fillRect(x, y, 1.5, 1.5); }
    const proj = (lat, lon) => [((lon + 180) / 360) * w, ((90 - lat) / 180) * h];
    // home
    const hc = homeCity(); const [hx, hy] = proj(hc.lat, hc.lon);
    S.stamps.forEach(s => {
      const d = D.DESTINATIONS.find(x => x.id === s.id); if (!d) return;
      const [x, y] = proj(d.lat, d.lon);
      ctx.strokeStyle = 'rgba(124,58,237,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(d.flag, x, y);
    });
    ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(hx, hy, 5, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '11px system-ui'; ctx.fillText('🏠 ' + hc.name, hx, hy - 10);
  }

  // ---------------- friends ----------------
  function friendObjects() { return D.BOTS.map(b => ({ ...b })); }
  function openFriends() {
    const friends = D.BOTS.filter(b => S.friends.includes(b.id));
    const others = D.BOTS.filter(b => !S.friends.includes(b.id) && !S.blocked.includes(b.id));
    const me = { name: S.name, flag: '🏠', minutes: S.totalMinutes, miles: S.miles, coins: S.coins };
    const board = D.BOTS.filter(b => !S.blocked.includes(b.id)).concat([me]).sort((a, b) => b.miles - a.miles || b.minutes - a.minutes);
    const html = `
      <div class="tabs"><button class="tab active" data-t="friends">Friends</button>
        <button class="tab" data-t="find">Find People</button>
        <button class="tab" data-t="board">Leaderboard</button></div>
      <div id="friends-tab">
        <div data-pane="friends">${friends.length ? friends.map(friendRow).join('') : '<p class="muted">No friends yet. Add some from “Find People”.</p>'}</div>
        <div data-pane="find" class="hidden">
          <input class="ob-input" id="friend-search" placeholder="Search username..." />
          <div id="find-list">${others.map(findRow).join('')}</div>
        </div>
        <div data-pane="board" class="hidden">
          ${board.map((b, i) => `<div class="board-row ${b.flag === '🏠' ? 'me' : ''}">
            <span class="board-rank">#${i + 1}</span><span class="board-name">${b.flag} ${esc(b.name)}${b.flag === '🏠' ? ' (you)' : ''}</span>
            <span class="board-stat">${(b.miles || 0).toLocaleString()} mi · ${b.minutes} min</span></div>`).join('')}
        </div>
      </div>`;
    openPanel('Friends & Community', html, { wide: true });
    const pane = (n) => $('panel-body').querySelector('[data-pane="' + n + '"]');
    $('panel-body').querySelectorAll('.tab').forEach(t => t.onclick = () => {
      $('panel-body').querySelectorAll('.tab').forEach(x => x.classList.remove('active')); t.classList.add('active');
      ['friends', 'find', 'board'].forEach(n => pane(n).classList.toggle('hidden', n !== t.dataset.t));
    });
    bindFriendButtons();
    const fs = $('friend-search'); if (fs) fs.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      $('find-list').innerHTML = others.filter(o => o.name.toLowerCase().includes(q)).map(findRow).join('');
      bindFriendButtons();
    });
  }
  function friendRow(b) {
    return `<div class="friend-row">
      <span class="friend-dot ${b.online ? 'on' : 'off'}"></span>
      <span class="friend-av" style="background:${b.char.outfit}">${b.name[0]}</span>
      <span class="friend-info"><b>${esc(b.name)}</b> ${b.flag}
        <span class="friend-meta">${b.online ? 'online · in ' + b.city : 'offline'} · ${b.minutes} min</span></span>
      <span class="friend-actions">
        <button class="btn btn-tiny" data-prof="${b.id}">Profile</button>
        ${b.online ? `<button class="btn btn-tiny btn-primary" data-invite="${b.id}">Study</button>` : ''}
      </span></div>`;
  }
  function findRow(b) {
    return `<div class="friend-row">
      <span class="friend-dot ${b.online ? 'on' : 'off'}"></span>
      <span class="friend-av" style="background:${b.char.outfit}">${b.name[0]}</span>
      <span class="friend-info"><b>${esc(b.name)}</b> ${b.flag}<span class="friend-meta">${b.city}</span></span>
      <button class="btn btn-tiny btn-primary" data-add="${b.id}">+ Add</button></div>`;
  }
  function bindFriendButtons() {
    $('panel-body').querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
      if (!S.friends.includes(b.dataset.add)) S.friends.push(b.dataset.add);
      save(); toast('Friend request accepted 🎉', '🤝'); openFriends();
    });
    $('panel-body').querySelectorAll('[data-prof]').forEach(b => b.onclick = () => openProfile(b.dataset.prof));
    $('panel-body').querySelectorAll('[data-invite]').forEach(b => b.onclick = () => inviteToStudy(b.dataset.invite));
  }
  function openProfile(id) {
    const b = D.BOTS.find(x => x.id === id); if (!b) return;
    const stamps = D.DESTINATIONS.slice(0, 4 + (b.name.length % 5));
    openPanel(b.name + "'s Profile", `
      <div class="profile-head">
        <div class="profile-av" style="background:${b.char.outfit}">${b.name[0]}</div>
        <div><h2>${esc(b.name)} ${b.flag}</h2><p class="muted">${b.online ? '🟢 online · in ' + b.city : '⚪ offline'}</p></div>
      </div>
      <div class="profile-stats">
        <div class="rstat"><span class="rstat-v">${b.minutes}</span><span class="rstat-l">study min</span></div>
        <div class="rstat"><span class="rstat-v">${Math.floor(b.minutes / 25)}</span><span class="rstat-l">sessions</span></div>
        <div class="rstat"><span class="rstat-v">${stamps.length}</span><span class="rstat-l">stamps</span></div>
      </div>
      <h3 class="step-h">Travel stamps</h3>
      <div class="stamp-grid">${stamps.map(s => `<div class="stamp"><span class="stamp-flag">${s.flag}</span><span class="stamp-name">${s.name}</span></div>`).join('')}</div>
      <div class="profile-actions">
        <button class="btn btn-primary" ${b.online ? '' : 'disabled'} onclick="SV.inviteToStudy('${b.id}')">📚 Study With Me</button>
        <button class="btn btn-secondary" onclick="SV.openDM('${b.id}')">💬 Message</button>
        <button class="btn btn-danger" onclick="SV.blockUser('${b.id}')">🚫 Block</button>
      </div>`, { wide: true });
  }
  function blockUser(id) {
    if (!S.blocked.includes(id)) S.blocked.push(id);
    S.friends = S.friends.filter(f => f !== id);
    save(); toast('User blocked', '🚫'); closePanel();
  }
  function inviteToStudy(id) {
    const b = D.BOTS.find(x => x.id === id); if (!b) return;
    closePanel();
    openPanel('Study Invite', `
      <div class="invite-box">
        <div class="invite-emoji">📚</div>
        <p><b>${esc(b.name)}</b> ${b.flag} accepted your study invite!</p>
        <p class="muted">Set up a shared session. Up to 6 friends can join.</p>
        <button class="btn btn-primary btn-lg" id="invite-start">Set Up Shared Session →</button>
      </div>`);
    $('invite-start').onclick = () => {
      closePanel();
      // build extra online friends as participants (max 6 total)
      const onlineFriends = D.BOTS.filter(x => x.online && x.id !== id).slice(0, 4);
      const participants = [b].concat(onlineFriends).slice(0, 5).map(p => ({ char: p.char, name: p.name, me: false, desk: [], coins: 0 }));
      pendingParticipants = participants;
      openTravelPanel('plane');
      // hook start to include participants
      const orig = $('start-session-btn');
      orig.onclick = () => { if (!sessionSetup.destination) return; closePanel(); beginSession(pendingParticipants); pendingParticipants = null; };
    };
  }
  let pendingParticipants = null;

  // ---------------- chat (simulated) ----------------
  let chatState = { room: 'global', messages: { global: [], lobby: [] }, dms: {}, timer: null, typingTimer: null };
  function seedChat() {
    if (chatState.messages.global.length) return;
    D.CHAT_LINES.slice(0, 6).forEach((line, i) => {
      const bot = D.BOTS[i % D.BOTS.length];
      chatState.messages.global.push({ from: bot, text: line, t: Date.now() - (6 - i) * 60000 });
    });
    chatState.messages.lobby.push({ from: D.BOTS[2], text: 'Anyone want to do a 50-min session at the cafe? ☕', t: Date.now() - 120000 });
  }
  function toggleChat(open) {
    const panel = $('chat-panel');
    const willOpen = open != null ? open : !panel.classList.contains('open');
    if (willOpen && session && session.focusMode) { toast('Chat is muted in Focus Mode', '🔇'); return; }
    panel.classList.toggle('open', willOpen);
    if (willOpen) { seedChat(); renderChat(); startChatBots(); }
    else stopChatBots();
  }
  function startChatBots() {
    if (chatState.timer) return;
    chatState.timer = setInterval(() => {
      if (Math.random() < 0.6) {
        const room = Math.random() < 0.7 ? 'global' : 'lobby';
        const bot = D.BOTS.filter(b => b.online && !S.blocked.includes(b.id))[Math.floor(Math.random() * 5)] || D.BOTS[0];
        // typing indicator
        showTyping(bot);
        setTimeout(() => {
          hideTyping();
          chatState.messages[room].push({ from: bot, text: D.CHAT_LINES[Math.floor(Math.random() * D.CHAT_LINES.length)], t: Date.now() });
          if (chatState.room === room) renderChat();
        }, 1400);
      }
    }, 7000);
  }
  function stopChatBots() { if (chatState.timer) { clearInterval(chatState.timer); chatState.timer = null; } }
  function showTyping(bot) { const t = $('chat-typing'); if (t) { t.textContent = bot.name + ' is typing…'; t.classList.remove('hidden'); } }
  function hideTyping() { const t = $('chat-typing'); if (t) t.classList.add('hidden'); }

  function renderChat() {
    const room = chatState.room;
    let msgs;
    if (room === 'global' || room === 'lobby') msgs = chatState.messages[room];
    else msgs = chatState.dms[room] || [];
    const body = $('chat-messages');
    body.innerHTML = msgs.map(m => {
      if (m.me) return `<div class="cmsg me"><div class="cbubble me">${esc(m.text)}${m.reactions ? reactHtml(m) : ''}</div></div>`;
      return `<div class="cmsg">
        <span class="chead" style="background:${m.from.char ? m.from.char.outfit : '#7c3aed'}">${m.from.name[0]}</span>
        <div><div class="cname">${esc(m.from.name)} ${m.from.flag || ''}</div>
        <div class="cbubble" data-react>${esc(m.text)}${m.reactions ? reactHtml(m) : ''}</div></div></div>`;
    }).join('') || '<p class="muted" style="text-align:center;padding:2rem">No messages yet — say hi! 👋</p>';
    body.scrollTop = body.scrollHeight;
    // tally chat people for quest (people whose messages we've seen)
    msgs.forEach(m => { if (m.from && m.from.id && !S.day.chatPeople.includes(m.from.id)) { S.day.chatPeople.push(m.from.id); } });
    save();
  }
  function reactHtml(m) { return `<span class="creacts">${Object.entries(m.reactions || {}).map(([e, n]) => `<span class="creact">${e} ${n}</span>`).join('')}</span>`; }

  function sendChat(text) {
    if (!text.trim()) return;
    const room = chatState.room;
    const msg = { me: true, text, t: Date.now(), reactions: null };
    if (room === 'global' || room === 'lobby') chatState.messages[room].push(msg);
    else { chatState.dms[room] = chatState.dms[room] || []; chatState.dms[room].push(msg); }
    renderChat();
    // bot reply in DM
    if (room.startsWith('dm_')) {
      const bot = D.BOTS.find(b => 'dm_' + b.id === room);
      if (bot) { showTyping(bot); setTimeout(() => { hideTyping(); chatState.dms[room].push({ from: bot, text: pick(['Sounds good! 📚', 'Lets do it 🔥', 'I am studying too rn', 'Nice, what subject?', 'gl with your session!']), t: Date.now() }); renderChat(); }, 1300); }
    }
  }
  function openDM(id) {
    const b = D.BOTS.find(x => x.id === id); if (!b) return;
    closePanel(); chatState.room = 'dm_' + id;
    if (!chatState.dms['dm_' + id]) chatState.dms['dm_' + id] = [];
    toggleChat(true); switchChatTabUI();
  }
  function switchChatTabUI() {
    $('chat-tabs').querySelectorAll('.ctab').forEach(t => t.classList.toggle('active', t.dataset.room === chatState.room));
    const isDm = chatState.room.startsWith('dm_');
    $('chat-room-name').textContent = isDm ? (D.BOTS.find(b => 'dm_' + b.id === chatState.room) || {}).name + ' (DM)' : (chatState.room === 'global' ? 'Global Chat' : 'Study Lobby');
  }

  // ---------------- dashboard ----------------
  function openDashboard() {
    rollPeriods();
    const nextQuests = D.QUESTS.filter(q => questValue(q) < q.goal).slice(0, 3);
    const onlineFriends = D.BOTS.filter(b => b.online && S.friends.includes(b.id));
    const html = `
      <div class="dash-grid">
        <div class="dash-card dash-hero">
          <div id="dash-char" class="dash-char"></div>
          <div class="dash-hero-info"><h2>${esc(S.name)}</h2>
            <p class="muted">🏠 ${homeCity().name}</p>
            <div class="dash-pills"><span>⭐ ${S.coins}</span><span>🔥 ${S.streak} day</span><span>✈️ ${S.miles.toLocaleString()} mi</span></div>
          </div>
        </div>
        <div class="dash-card">
          <h3>📚 Total Study</h3><p class="dash-big">${S.totalMinutes} min</p>
          <p class="muted">${Math.floor(S.totalMinutes / 60)}h ${S.totalMinutes % 60}m across ${S.stamps.length} cities</p>
        </div>
        <div class="dash-card">
          <h3>✈️ Last Trip</h3>
          ${S.lastSession ? `<p class="dash-big">${esc(S.lastSession.dest)}</p><p class="muted">${S.lastSession.minutes} min · +${S.lastSession.coins} coins</p>` : '<p class="muted">No flights yet. Visit the airport!</p>'}
        </div>
        <div class="dash-card">
          <h3>📋 Active Quests</h3>
          ${nextQuests.map(q => { const v = Math.min(questValue(q), q.goal); return `<div class="dash-quest"><span>${q.text}</span><div class="quest-bar sm"><div class="quest-fill" style="width:${(v / q.goal) * 100}%"></div></div></div>`; }).join('') || '<p class="muted">All caught up! 🎉</p>'}
        </div>
        <div class="dash-card">
          <h3>🤝 Friend Activity</h3>
          ${onlineFriends.length ? onlineFriends.map(f => `<div class="dash-friend"><span class="friend-dot on"></span>${f.name} ${f.flag} <span class="muted">studying in ${f.city}</span></div>`).join('') : '<p class="muted">No friends online. Add some in Friends Plaza!</p>'}
        </div>
        <div class="dash-card dash-cta">
          <h3>Ready to study?</h3>
          <button class="btn btn-primary btn-lg" onclick="SV.closePanel();SV.openTravel()">✈️ Start a Flight</button>
        </div>
      </div>`;
    openPanel('Dashboard', html, { wide: true, onOpen: () => mountPreview($('dash-char'), S.character, S.name) });
  }

  // ---------------- profile (self) ----------------
  function openSelfProfile() {
    const countries = new Set(S.stamps.map(s => s.country)).size;
    openPanel('My Profile', `
      <div class="profile-head"><div id="self-prof-char" class="dash-char"></div>
        <div><h2>${esc(S.name)} 🏠</h2><p class="muted">Home: ${homeCity().name}</p></div></div>
      <div class="profile-stats">
        <div class="rstat"><span class="rstat-v">${S.totalMinutes}</span><span class="rstat-l">minutes</span></div>
        <div class="rstat"><span class="rstat-v">${S.coins}</span><span class="rstat-l">coins</span></div>
        <div class="rstat"><span class="rstat-v">${S.streak}</span><span class="rstat-l">day streak</span></div>
        <div class="rstat"><span class="rstat-v">${countries}</span><span class="rstat-l">countries</span></div>
      </div>
      <h3 class="step-h">Customize Character</h3>
      <div id="self-customizer"></div>
      <h3 class="step-h">Home City</h3>
      <select id="home-select" class="ob-input">${D.HOME_CITIES.map(c => `<option value="${c.id}" ${c.id === S.homeCityId ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
      <h3 class="step-h">Friends (${S.friends.length})</h3>
      <div>${S.friends.length ? D.BOTS.filter(b => S.friends.includes(b.id)).map(friendRow).join('') : '<p class="muted">No friends yet.</p>'}</div>
      `, {
      wide: true, onOpen: () => {
        mountPreview($('self-prof-char'), S.character, S.name);
        const draft = JSON.parse(JSON.stringify(S.character));
        renderCustomizer($('self-customizer'), draft, () => {
          S.character = draft; save(); mountPreview($('self-prof-char'), S.character, S.name); W.refreshPlayer(S.character, S.name);
        });
        $('home-select').onchange = e => { S.homeCityId = e.target.value; save(); toast('Home city updated', '🏠'); };
      }
    });
    bindFriendButtons();
  }

  // ---------------- ambient audio (web audio, generated) ----------------
  let audioCtx, ambientNodes = [];
  function startAmbient(type) {
    if (type === 'silence') return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx;
      stopAmbient();
      if (type === 'ocean' || type === 'cafe' || type === 'city' || type === 'train' || type === 'space') {
        // filtered noise
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource(); noise.buffer = buffer; noise.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = type === 'ocean' ? 500 : type === 'train' ? 300 : type === 'space' ? 200 : 900;
        const gain = ctx.createGain(); gain.gain.value = 0.04;
        noise.connect(filter).connect(gain).connect(ctx.destination);
        noise.start();
        ambientNodes = [noise, gain];
        // LFO for ocean swell
        if (type === 'ocean') { const lfo = ctx.createOscillator(); lfo.frequency.value = 0.1; const lg = ctx.createGain(); lg.gain.value = 0.03; lfo.connect(lg).connect(gain.gain); lfo.start(); ambientNodes.push(lfo); }
      } else if (type === 'birds') {
        const gain = ctx.createGain(); gain.gain.value = 0.0; gain.connect(ctx.destination);
        ambientNodes = [gain];
        const chirp = () => {
          if (!ambientNodes.length) return;
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.frequency.value = 1800 + Math.random() * 1200; o.connect(g).connect(ctx.destination);
          g.gain.setValueAtTime(0.0, ctx.currentTime); g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
          g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2); o.start(); o.stop(ctx.currentTime + 0.25);
          ambientNodes._t = setTimeout(chirp, 800 + Math.random() * 2000);
        };
        chirp();
      }
    } catch (e) { /* audio not available */ }
  }
  function stopAmbient() {
    ambientNodes.forEach(n => { try { n.stop && n.stop(); } catch (e) {} });
    if (ambientNodes._t) clearTimeout(ambientNodes._t);
    ambientNodes = [];
  }

  // ---------------- mobile joystick ----------------
  function setupJoystick() {
    const base = $('joystick'); const stick = $('joystick-stick');
    if (!base) return;
    let active = false, cx = 0, cy = 0;
    function start(e) { active = true; const r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); }
    function move(e) {
      if (!active) return;
      const p = e.touches ? e.touches[0] : e;
      let dx = p.clientX - cx, dy = p.clientY - cy;
      const max = 40, d = Math.hypot(dx, dy);
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      stick.style.transform = `translate(${dx}px,${dy}px)`;
      W.setJoystick(dx / max, dy / max);
    }
    function end() { active = false; stick.style.transform = 'translate(0,0)'; W.setJoystick(0, 0); }
    base.addEventListener('touchstart', start, { passive: true });
    base.addEventListener('touchmove', move, { passive: true });
    base.addEventListener('touchend', end);
    base.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
  }

  // ---------------- utils ----------------
  function fmt(sec) { const m = Math.floor(sec / 60), s = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function roundRectC(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function isTouch() { return ('ontouchstart' in window) || navigator.maxTouchPoints > 0; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // ---------------- boot ----------------
  function boot() {
    W.init($('canvas'));
    setupJoystick();
    // HUD nav buttons
    document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
      const n = b.dataset.nav;
      ({ dashboard: openDashboard, shop: openShop, quests: openQuests, passport: openPassport, friends: openFriends, profile: openSelfProfile, chat: () => toggleChat(true), travel: () => openTravelPanel('plane') }[n] || (() => {}))();
    });
    $('panel-close').onclick = closePanel;
    $('enter-prompt').onclick = () => enterLocation($('enter-prompt').dataset.loc);
    window.addEventListener('keydown', e => { if ((e.key === 'e' || e.key === 'E') && !$('enter-prompt').classList.contains('hidden')) enterLocation($('enter-prompt').dataset.loc); });
    // chat panel controls
    $('chat-close').onclick = () => toggleChat(false);
    $('chat-tabs').querySelectorAll('.ctab').forEach(t => t.onclick = () => { chatState.room = t.dataset.room; switchChatTabUI(); renderChat(); });
    $('chat-send').onclick = () => { sendChat($('chat-input').value); $('chat-input').value = ''; };
    $('chat-input').addEventListener('keydown', e => { if (e.key === 'Enter') { sendChat($('chat-input').value); $('chat-input').value = ''; } });
    // emoji/sticker/reactions bar
    $('chat-emoji-btn').onclick = () => $('emoji-tray').classList.toggle('hidden');
    $('emoji-tray').innerHTML = D.EMOJIS.concat(D.STICKERS).map(e => `<button class="emoji-btn">${e}</button>`).join('');
    $('emoji-tray').querySelectorAll('.emoji-btn').forEach(b => b.onclick = () => { $('chat-input').value += b.textContent; $('emoji-tray').classList.add('hidden'); });
    // reactions on bot bubbles (event delegation)
    $('chat-messages').addEventListener('click', e => {
      const bubble = e.target.closest('[data-react]'); if (!bubble) return;
      showReactPicker(bubble);
    });

    updateHud();
    if (S.onboarded) { $('onboarding').classList.add('hidden'); enterMainWorld(); }
    else startOnboarding();

    // periodic day-night refresh
    setInterval(() => W.tickDayNight(), 30000);
  }

  function showReactPicker(bubble) {
    const existing = document.querySelector('.react-picker'); if (existing) existing.remove();
    const pick = document.createElement('div'); pick.className = 'react-picker';
    pick.innerHTML = D.REACTIONS.map(r => `<button>${r}</button>`).join('');
    bubble.appendChild(pick);
    pick.querySelectorAll('button').forEach(b => b.onclick = (ev) => {
      ev.stopPropagation();
      toast('Reacted ' + b.textContent, b.textContent);
      pick.remove();
    });
    setTimeout(() => document.addEventListener('click', function h() { pick.remove(); document.removeEventListener('click', h); }), 50);
  }

  // expose
  window.SV = {
    boot, closePanel, openTravel: () => openTravelPanel('plane'), backTravel,
    inviteToStudy, openDM, blockUser,
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
