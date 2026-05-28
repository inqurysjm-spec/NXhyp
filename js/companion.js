var TRAITS = [
  { id: 'hat',     name: '🎩 Top Hat',      cost: 50,  desc: 'A dapper hat for your companion' },
  { id: 'glasses', name: '🕶️ Sunglasses',   cost: 30,  desc: 'Cool shades to block the haters' },
  { id: 'crown',   name: '👑 Crown',         cost: 200, desc: 'Royal treatment for royalty' },
  { id: 'wings',   name: '🪽 Wings',         cost: 100, desc: 'Soar to new heights' },
  { id: 'bow',     name: '🎀 Bow',           cost: 40,  desc: 'A cute bow for your companion' },
  { id: 'star',    name: '⭐ Star Halo',     cost: 120, desc: 'Shine like a star' },
  { id: 'armor',   name: '🛡️ Armor',         cost: 80,  desc: 'Protection from bad days' },
  { id: 'rainbow', name: '🌈 Rainbow Aura',  cost: 150, desc: 'Radiate rainbow energy' },
];

function getCompanionData() {
  if (!NX.user) return {};
  try { return JSON.parse(NX.user.companion || '{}'); } catch(e) { return {}; }
}

function getOwnedTraits() {
  if (!NX.user) return [];
  try { return JSON.parse(NX.user.trait_owned || '[]'); } catch(e) { return []; }
}

function getCompanionMood() {
  if (!NX.user) return 'neutral';
  var steps = NX.user.steps || 0;
  var water = NX.user.water_count || 0;
  var sleep = NX.user.sleep_h || 0;
  var streak = NX.user.streak || 0;
  var score = 0;
  if (steps >= 10000) score += 3;
  else if (steps >= 5000) score += 2;
  else if (steps >= 2000) score += 1;
  if (water >= 8) score += 3;
  else if (water >= 5) score += 2;
  else if (water >= 3) score += 1;
  if (sleep >= 7) score += 3;
  else if (sleep >= 6) score += 2;
  else if (sleep >= 4) score += 1;
  if (streak >= 7) return 'excited';
  if (score >= 7) return 'happy';
  if (score >= 4) return 'neutral';
  return 'sad';
}

function renderCompanion() {
  var el = document.getElementById('view-companion');
  if (!el) return;
  var compData = getCompanionData();
  var mood = getCompanionMood();
  var moodLabel = t('comp_mood_' + mood);
  var ownedTraits = getOwnedTraits();
  var equippedTraits = compData.traits || [];

  el.innerHTML = '<div class="view-header"><h2 data-t="comp_title">' + t('comp_title') + '</h2></div>' +
    '<div class="comp-layout">' +
      '<div class="comp-display-section">' +
        '<div class="comp-avatar-wrap">' +
          '<div class="comp-mood-badge mood-' + mood + '">' + moodLabel + '</div>' +
          renderCompanionAvatar(compData, mood, equippedTraits) +
          '<div class="comp-name-text">' + (compData.name || 'Buddy') + '</div>' +
        '</div>' +
        '<div class="comp-mood-bar">' +
          '<div class="mood-indicators">' +
            '<div class="mood-stat"><span>👟</span> ' + (NX.user.steps || 0).toLocaleString() + '</div>' +
            '<div class="mood-stat"><span>💧</span> ' + (NX.user.water_count || 0) + ' cups</div>' +
            '<div class="mood-stat"><span>😴</span> ' + (NX.user.sleep_h || 0) + 'h ' + (NX.user.sleep_m || 0) + 'm</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="comp-editor-section">' +
        '<div class="tabs">' +
          '<button class="tab-btn active" onclick="switchCompTab(\'customize\')">' + t('comp_draw') + '</button>' +
          '<button class="tab-btn" onclick="switchCompTab(\'traits\')">' + t('comp_traits') + '</button>' +
        '</div>' +
        '<div id="comp-tab-customize" class="comp-tab">' +
          '<div class="comp-name-edit">' +
            '<input type="text" id="comp-name-input" value="' + (compData.name || 'Buddy') + '" placeholder="' + t('comp_name') + '" maxlength="20">' +
          '</div>' +
          '<div class="premade-tabs">' +
            '<button class="premade-tab active" onclick="switchDrawMode(\'premade\')">' + t('comp_premade') + '</button>' +
            '<button class="premade-tab" onclick="switchDrawMode(\'draw\')">' + t('comp_draw') + '</button>' +
          '</div>' +
          '<div id="comp-premade-section">' +
            '<div class="premade-grid">' +
              PREMADES.map(function(p) {
                return '<button class="premade-btn' + (compData.premade_id === p.id && compData.comp_mode !== 'draw' ? ' active' : '') +
                  '" onclick="selectPremade(' + p.id + ')" title="' + p.name + '">' +
                  '<span style="font-size:2.5rem">' + p.emoji + '</span>' +
                  '<span>' + p.name + '</span>' +
                  '</button>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div id="comp-draw-section" style="display:none">' +
            '<p class="hint">' + t('comp_draw_hint') + '</p>' +
            '<div class="canvas-toolbar">' +
              '<div class="color-palette">' +
                ['#7c3aed','#ef4444','#f59e0b','#10b981','#06b6d4','#3b82f6','#ec4899','#000000','#ffffff'].map(function(c) {
                  return '<button class="color-btn' + (c === NX.canvasColor ? ' active' : '') + '" data-color="' + c +
                    '" style="background:' + c + '" onclick="setCanvasColor(\'' + c + '\')"></button>';
                }).join('') +
              '</div>' +
              '<div class="canvas-tools">' +
                '<label>Size: <input type="range" min="2" max="20" value="' + NX.canvasBrush + '" oninput="setBrushSize(this.value)"></label>' +
                '<button id="eraser-btn" class="tool-btn' + (NX.canvasErasing ? ' active' : '') + '" onclick="toggleEraser()">⌫ Erase</button>' +
                '<button class="tool-btn" onclick="clearCanvas()">' + t('comp_clear') + '</button>' +
              '</div>' +
            '</div>' +
            '<canvas id="companion-canvas" width="200" height="200" style="border:2px solid var(--border);border-radius:12px;cursor:crosshair;width:100%;max-width:280px;display:block;margin:0 auto;background:#fff"></canvas>' +
          '</div>' +
          '<button class="btn btn-primary" style="margin-top:1rem;width:100%" onclick="saveCompanion()">' + t('comp_save') + '</button>' +
        '</div>' +
        '<div id="comp-tab-traits" class="comp-tab" style="display:none">' +
          '<div class="traits-pts">Your points: <strong>' + (NX.user ? NX.user.pts : 0) + ' pts</strong></div>' +
          '<div class="traits-grid">' +
            TRAITS.map(function(trait) {
              var owned = ownedTraits.includes(trait.id);
              var equipped = equippedTraits.includes(trait.id);
              return '<div class="trait-card' + (equipped ? ' equipped' : '') + '">' +
                '<div class="trait-icon">' + trait.name.split(' ')[0] + '</div>' +
                '<div class="trait-info">' +
                  '<div class="trait-name">' + trait.name.slice(trait.name.indexOf(' ') + 1) + '</div>' +
                  '<div class="trait-desc">' + trait.desc + '</div>' +
                '</div>' +
                '<div class="trait-action">' +
                  (owned ? (equipped ?
                    '<button class="btn btn-sm btn-outline" onclick="unequipTrait(\'' + trait.id + '\')">Unequip</button>' :
                    '<button class="btn btn-sm btn-primary" onclick="equipTrait(\'' + trait.id + '\')">' + t('comp_trait_equip') + '</button>'
                  ) :
                    '<button class="btn btn-sm btn-secondary" onclick="buyTrait(\'' + trait.id + '\')">' +
                      '<span>' + t('comp_trait_buy') + '</span><span class="trait-cost">' + trait.cost + ' pts</span>' +
                    '</button>'
                  ) +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  // Init canvas if in draw mode
  if (compData.comp_mode === 'draw') {
    switchDrawMode('draw');
    setTimeout(function() {
      initDrawCanvas('companion-canvas');
      if (compData.image) setCanvasData(compData.image);
    }, 50);
  } else {
    switchDrawMode('premade');
  }
}

function renderCompanionAvatar(compData, mood, equippedTraits) {
  equippedTraits = equippedTraits || [];
  if (compData.comp_mode === 'draw' && compData.image) {
    return '<div class="comp-avatar draw-avatar ' + mood + '" style="background-image:url(\'' + compData.image + '\')"></div>';
  }
  var premadeId = compData.premade_id !== undefined ? compData.premade_id : 0;
  var emoji = PREMADES[premadeId] ? PREMADES[premadeId].emoji : '🐱';
  var overlays = '';
  if (equippedTraits.includes('hat')) overlays += '<div class="trait-overlay hat">🎩</div>';
  if (equippedTraits.includes('crown')) overlays += '<div class="trait-overlay crown">👑</div>';
  if (equippedTraits.includes('glasses')) overlays += '<div class="trait-overlay glasses">🕶️</div>';
  if (equippedTraits.includes('wings')) overlays += '<div class="trait-overlay wings">🪽</div>';
  if (equippedTraits.includes('rainbow')) overlays += '<div class="trait-overlay rainbow-aura"></div>';
  if (equippedTraits.includes('star')) overlays += '<div class="trait-overlay star-halo">⭐</div>';
  if (equippedTraits.includes('bow')) overlays += '<div class="trait-overlay bow">🎀</div>';
  if (equippedTraits.includes('armor')) overlays += '<div class="trait-overlay armor">🛡️</div>';
  return '<div class="comp-avatar premade-avatar ' + mood + '">' + overlays + '<span class="comp-emoji">' + emoji + '</span></div>';
}

function renderMiniCompanion(containerId) {
  var container = document.getElementById(containerId);
  if (!container || !NX.user) return;
  var compData = getCompanionData();
  var mood = getCompanionMood();
  var equippedTraits = compData.traits || [];
  container.innerHTML = renderCompanionAvatar(compData, mood, equippedTraits);
}

function switchCompTab(tab) {
  document.querySelectorAll('.comp-tab').forEach(function(el) { el.style.display = 'none'; });
  document.querySelectorAll('.tabs .tab-btn').forEach(function(btn, i) {
    btn.classList.toggle('active', (i === 0 && tab === 'customize') || (i === 1 && tab === 'traits'));
  });
  var tabEl = document.getElementById('comp-tab-' + tab);
  if (tabEl) tabEl.style.display = 'block';
  if (tab === 'traits') {
    // Refresh traits view with latest user data
  }
}

function switchDrawMode(mode) {
  var premadeSection = document.getElementById('comp-premade-section');
  var drawSection = document.getElementById('comp-draw-section');
  var tabs = document.querySelectorAll('.premade-tab');
  if (mode === 'premade') {
    if (premadeSection) premadeSection.style.display = 'block';
    if (drawSection) drawSection.style.display = 'none';
    if (tabs[0]) tabs[0].classList.add('active');
    if (tabs[1]) tabs[1].classList.remove('active');
  } else {
    if (premadeSection) premadeSection.style.display = 'none';
    if (drawSection) drawSection.style.display = 'block';
    if (tabs[0]) tabs[0].classList.remove('active');
    if (tabs[1]) tabs[1].classList.add('active');
    setTimeout(function() {
      initDrawCanvas('companion-canvas');
      var compData = getCompanionData();
      if (compData.image) setCanvasData(compData.image);
    }, 50);
  }
  NX.compDrawMode = mode;
}

function selectPremade(id) {
  document.querySelectorAll('.premade-btn').forEach(function(btn, i) {
    btn.classList.toggle('active', i === id);
  });
  NX.selectedPremadeId = id;
  // Preview the premade on a mini canvas
  var previewCanvas = document.createElement('canvas');
  previewCanvas.width = 200; previewCanvas.height = 200;
  document.body.appendChild(previewCanvas);
  _canvas = previewCanvas;
  _ctx = previewCanvas.getContext('2d');
  drawPremade(id);
  var dataUrl = previewCanvas.toDataURL('image/png');
  document.body.removeChild(previewCanvas);
  _canvas = null; _ctx = null;
  NX.pendingCompanionImage = dataUrl;
}

async function saveCompanion() {
  if (!NX.user) return;
  var nameInput = document.getElementById('comp-name-input');
  var name = nameInput ? nameInput.value.trim() || 'Buddy' : 'Buddy';
  var compData = getCompanionData();

  var mode = NX.compDrawMode || (compData.comp_mode || 'premade');
  var image = '';
  var premadeId = NX.selectedPremadeId !== undefined ? NX.selectedPremadeId : (compData.premade_id || 0);

  if (mode === 'draw') {
    image = getCanvasData();
  } else {
    // Draw premade to canvas and save
    image = NX.pendingCompanionImage || compData.image || '';
    if (!image || NX.selectedPremadeId !== undefined) {
      var tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = 200; tmpCanvas.height = 200;
      document.body.appendChild(tmpCanvas);
      _canvas = tmpCanvas;
      _ctx = tmpCanvas.getContext('2d');
      drawPremade(premadeId);
      image = tmpCanvas.toDataURL('image/png');
      document.body.removeChild(tmpCanvas);
      _canvas = null; _ctx = null;
    }
  }

  var newCompData = {
    name: name,
    image: image,
    traits: compData.traits || [],
    comp_mode: mode,
    premade_id: premadeId,
  };

  await sb('PATCH', 'users?id=eq.' + NX.user.id, {
    companion: JSON.stringify(newCompData),
    comp_mode: mode,
  });
  patchUser({ companion: JSON.stringify(newCompData), comp_mode: mode });
  showToast('Companion saved! 🐾', 'success');
  renderCompanion();
}

async function buyTrait(traitId) {
  if (!NX.user) return;
  var trait = TRAITS.find(function(t) { return t.id === traitId; });
  if (!trait) return;
  var pts = NX.user.pts || 0;
  if (pts < trait.cost) { showToast(t('comp_not_enough'), 'error'); return; }
  var owned = getOwnedTraits();
  if (owned.includes(traitId)) return;
  owned.push(traitId);
  var newPts = pts - trait.cost;
  await sb('PATCH', 'users?id=eq.' + NX.user.id, {
    pts: newPts,
    trait_owned: JSON.stringify(owned),
  });
  patchUser({ pts: newPts, trait_owned: JSON.stringify(owned) });
  showToast('Trait unlocked: ' + trait.name + '!', 'success');
  renderCompanion();
  switchCompTab('traits');
}

async function equipTrait(traitId) {
  if (!NX.user) return;
  var compData = getCompanionData();
  var traits = compData.traits || [];
  if (!traits.includes(traitId)) traits.push(traitId);
  compData.traits = traits;
  await sb('PATCH', 'users?id=eq.' + NX.user.id, { companion: JSON.stringify(compData) });
  patchUser({ companion: JSON.stringify(compData) });
  renderCompanion();
  switchCompTab('traits');
}

async function unequipTrait(traitId) {
  if (!NX.user) return;
  var compData = getCompanionData();
  compData.traits = (compData.traits || []).filter(function(id) { return id !== traitId; });
  await sb('PATCH', 'users?id=eq.' + NX.user.id, { companion: JSON.stringify(compData) });
  patchUser({ companion: JSON.stringify(compData) });
  renderCompanion();
  switchCompTab('traits');
}
