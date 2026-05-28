// ========== DASHBOARD ==========
function renderDashboard() {
  var el = document.getElementById('view-dashboard');
  if (!el || !NX.user) return;
  var u = NX.user;
  var hour = new Date().getHours();
  var greeting = hour < 12 ? t('dash_good_morning') : hour < 17 ? t('dash_good_afternoon') : t('dash_good_evening');
  var levelPts = u.level_pts || 0;
  var levelMax = u.level_max || 100;
  var pct = Math.min(100, Math.round((levelPts / levelMax) * 100));
  var weeklySteps = [];
  try { weeklySteps = JSON.parse(u.weekly_steps || '[]'); } catch(e) { weeklySteps = [0,0,0,0,0,0,0]; }
  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var today = new Date().getDay();
  var maxSteps = Math.max.apply(null, weeklySteps.concat([1]));

  el.innerHTML =
    '<div class="dashboard-header">' +
      '<div class="dash-greeting">' +
        '<div id="mini-companion-dash" class="mini-companion"></div>' +
        '<div>' +
          '<div class="greeting-text">' + greeting + ', <strong>' + u.username + '</strong>!</div>' +
          '<div class="streak-badge">🔥 ' + (u.streak || 0) + ' ' + t('dash_streak') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="level-card">' +
        '<div class="level-info">' +
          '<span class="level-badge">' + t('dash_level') + ' ' + (u.level || 1) + '</span>' +
          '<span class="pts-count">' + (u.pts || 0) + ' ' + t('dash_pts') + '</span>' +
        '</div>' +
        '<div class="xp-bar"><div class="xp-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="xp-label">' + levelPts + ' / ' + levelMax + ' XP</div>' +
      '</div>' +
    '</div>' +
    '<h3 class="section-title">' + t('dash_today') + '</h3>' +
    '<div class="stats-grid">' +
      '<div class="stat-card" onclick="goTo(\'steps\')">' +
        '<div class="stat-icon">👟</div>' +
        '<div class="stat-value">' + (u.steps || 0).toLocaleString() + '</div>' +
        '<div class="stat-label">' + t('dash_steps') + '</div>' +
        '<div class="stat-bar"><div class="stat-fill steps-fill" style="width:' + Math.min(100, Math.round(((u.steps||0)/10000)*100)) + '%"></div></div>' +
      '</div>' +
      '<div class="stat-card" onclick="goTo(\'sleep\')">' +
        '<div class="stat-icon">😴</div>' +
        '<div class="stat-value">' + (u.sleep_h || 0) + 'h ' + (u.sleep_m || 0) + 'm</div>' +
        '<div class="stat-label">' + t('dash_sleep') + '</div>' +
        '<div class="stat-bar"><div class="stat-fill sleep-fill" style="width:' + Math.min(100, Math.round(((u.sleep_h||0)/8)*100)) + '%"></div></div>' +
      '</div>' +
      '<div class="stat-card" onclick="goTo(\'water\')">' +
        '<div class="stat-icon">💧</div>' +
        '<div class="stat-value">' + (u.water_count || 0) + ' / 8</div>' +
        '<div class="stat-label">' + t('dash_water') + '</div>' +
        '<div class="stat-bar"><div class="stat-fill water-fill" style="width:' + Math.min(100, Math.round(((u.water_count||0)/8)*100)) + '%"></div></div>' +
      '</div>' +
      '<div class="stat-card" onclick="goTo(\'companion\')">' +
        '<div class="stat-icon">🐾</div>' +
        '<div class="stat-value companion-mood-dash">' + t('comp_mood_' + getCompanionMood()) + '</div>' +
        '<div class="stat-label">' + t('nav_companion') + '</div>' +
      '</div>' +
    '</div>' +
    '<h3 class="section-title">' + t('dash_weekly') + '</h3>' +
    '<div class="weekly-chart">' +
      weeklySteps.map(function(s, i) {
        var barH = maxSteps > 0 ? Math.round((s / maxSteps) * 80) : 0;
        return '<div class="week-bar-wrap' + (i === today ? ' today' : '') + '">' +
          '<div class="week-bar-val">' + (s >= 1000 ? (s/1000).toFixed(1) + 'k' : s) + '</div>' +
          '<div class="week-bar-track"><div class="week-bar-fill" style="height:' + barH + 'px"></div></div>' +
          '<div class="week-day">' + days[i] + '</div>' +
        '</div>';
      }).join('') +
    '</div>';

  renderMiniCompanion('mini-companion-dash');
}

// ========== STEPS ==========
function renderSteps() {
  var el = document.getElementById('view-steps');
  if (!el || !NX.user) return;
  var u = NX.user;
  var steps = u.steps || 0;
  var pct = Math.min(100, Math.round((steps / 10000) * 100));
  var hourlySteps = [];
  try { hourlySteps = JSON.parse(u.hourly_steps || '[]'); } catch(e) { hourlySteps = new Array(24).fill(0); }
  if (hourlySteps.length < 24) hourlySteps = new Array(24).fill(0);
  var maxH = Math.max.apply(null, hourlySteps.concat([1]));
  var weeklySteps = [];
  try { weeklySteps = JSON.parse(u.weekly_steps || '[]'); } catch(e) { weeklySteps = [0,0,0,0,0,0,0]; }
  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var maxW = Math.max.apply(null, weeklySteps.concat([1]));
  var today = new Date().getDay();

  el.innerHTML =
    '<div class="view-header"><h2>' + t('steps_title') + '</h2></div>' +
    '<div class="tracker-hero steps-hero">' +
      '<div class="tracker-ring">' +
        '<svg viewBox="0 0 120 120" width="160" height="160">' +
          '<circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" stroke-width="10"/>' +
          '<circle cx="60" cy="60" r="50" fill="none" stroke="#7c3aed" stroke-width="10" stroke-dasharray="314" stroke-dashoffset="' + (314 * (1 - pct/100)) + '" stroke-linecap="round" transform="rotate(-90 60 60)"/>' +
        '</svg>' +
        '<div class="ring-inner">' +
          '<div class="ring-value">' + steps.toLocaleString() + '</div>' +
          '<div class="ring-label">steps</div>' +
        '</div>' +
      '</div>' +
      '<div class="tracker-info">' +
        '<div class="info-row"><span>🎯 ' + t('steps_goal') + '</span><span class="info-val">' + pct + '%</span></div>' +
        (steps >= 10000 ? '<div class="goal-badge">' + t('steps_great') + '</div>' : '') +
      '</div>' +
    '</div>' +
    '<div class="log-form card">' +
      '<h3>' + t('steps_add') + '</h3>' +
      '<div class="form-row">' +
        '<input type="number" id="steps-input" min="0" max="100000" placeholder="' + t('steps_count') + '">' +
        '<button class="btn btn-primary" onclick="logSteps()">' + t('steps_save') + '</button>' +
      '</div>' +
      '<div class="quick-steps">' +
        [1000, 2500, 5000, 7500, 10000].map(function(n) {
          return '<button class="quick-btn" onclick="document.getElementById(\'steps-input\').value=' + n + '">' + n.toLocaleString() + '</button>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div class="chart-card card">' +
      '<h3>' + t('steps_hourly') + '</h3>' +
      '<div class="hourly-chart">' +
        hourlySteps.map(function(s, i) {
          var barH = maxH > 0 ? Math.max(2, Math.round((s / maxH) * 80)) : 2;
          var label = i === 0 ? '12a' : i === 12 ? '12p' : i < 12 ? i + 'a' : (i-12) + 'p';
          return '<div class="h-bar-wrap' + (i === new Date().getHours() ? ' now' : '') + '" title="' + label + ': ' + s + ' steps">' +
            '<div class="h-bar-track"><div class="h-bar-fill" style="height:' + barH + 'px"></div></div>' +
            (i % 6 === 0 ? '<div class="h-label">' + label + '</div>' : '<div class="h-label"></div>') +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div class="chart-card card">' +
      '<h3>' + t('steps_weekly') + '</h3>' +
      '<div class="weekly-chart">' +
        weeklySteps.map(function(s, i) {
          var barH = maxW > 0 ? Math.round((s / maxW) * 80) : 0;
          return '<div class="week-bar-wrap' + (i === today ? ' today' : '') + '">' +
            '<div class="week-bar-val">' + (s >= 1000 ? (s/1000).toFixed(1) + 'k' : s) + '</div>' +
            '<div class="week-bar-track"><div class="week-bar-fill" style="height:' + Math.max(2,barH) + 'px"></div></div>' +
            '<div class="week-day">' + days[i] + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
}

async function logSteps() {
  var input = document.getElementById('steps-input');
  var val = parseInt(input.value);
  if (!val || val < 0) { showToast('Please enter a valid step count', 'error'); return; }
  var u = NX.user;
  var hourlySteps = [];
  try { hourlySteps = JSON.parse(u.hourly_steps || '[]'); } catch(e) { hourlySteps = new Array(24).fill(0); }
  if (hourlySteps.length < 24) hourlySteps = new Array(24).fill(0);
  var currentHour = new Date().getHours();
  hourlySteps[currentHour] = (hourlySteps[currentHour] || 0) + val;

  var weeklySteps = [];
  try { weeklySteps = JSON.parse(u.weekly_steps || '[]'); } catch(e) { weeklySteps = [0,0,0,0,0,0,0]; }
  if (weeklySteps.length < 7) weeklySteps = [0,0,0,0,0,0,0];
  var today = new Date().getDay();
  weeklySteps[today] = (weeklySteps[today] || 0) + val;

  var newSteps = (u.steps || 0) + val;
  var addPts = Math.floor(val / 100);
  var newPts = (u.pts || 0) + addPts;
  var levelData = calcLevel(u.level || 1, u.level_pts || 0, addPts, u.level_max || 100);

  var update = {
    steps: newSteps,
    hourly_steps: JSON.stringify(hourlySteps),
    weekly_steps: JSON.stringify(weeklySteps),
    pts: newPts,
    level: levelData.level,
    level_pts: levelData.level_pts,
    level_max: levelData.level_max,
  };
  await sb('PATCH', 'users?id=eq.' + u.id, update);
  patchUser(update);
  input.value = '';
  showToast('Steps logged! +' + addPts + ' pts', 'success');
  renderSteps();
}

// ========== SLEEP ==========
function renderSleep() {
  var el = document.getElementById('view-sleep');
  if (!el || !NX.user) return;
  var u = NX.user;
  var phases = {};
  try { phases = JSON.parse(u.sleep_phases || '{}'); } catch(e) { phases = {}; }
  var total = (phases.deep||0) + (phases.light||0) + (phases.rem||0) + (phases.awake||0) || 1;

  el.innerHTML =
    '<div class="view-header"><h2>' + t('sleep_title') + '</h2></div>' +
    '<div class="tracker-hero sleep-hero">' +
      '<div class="sleep-display">' +
        '<div class="sleep-icon">😴</div>' +
        '<div class="sleep-duration">' + (u.sleep_h || 0) + 'h ' + (u.sleep_m || 0) + 'm</div>' +
        '<div class="sleep-label">last logged</div>' +
      '</div>' +
    '</div>' +
    '<div class="log-form card">' +
      '<h3>' + t('sleep_log') + '</h3>' +
      '<div class="sleep-inputs">' +
        '<label>' + t('sleep_bedtime') + '<input type="time" id="sleep-bed" value="23:00"></label>' +
        '<label>' + t('sleep_wake') + '<input type="time" id="sleep-wake" value="07:00"></label>' +
      '</div>' +
      '<div class="sleep-quality">' +
        '<label>' + t('sleep_quality') + '</label>' +
        '<div class="quality-btns">' +
          ['😫','😕','😐','🙂','😄'].map(function(e, i) {
            return '<button class="quality-btn" data-q="' + (i+1) + '" onclick="selectQuality(this)" title="' + (i+1) + '/5">' + e + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<button class="btn btn-primary" style="width:100%;margin-top:1rem" onclick="logSleep()">' + t('sleep_save') + '</button>' +
    '</div>' +
    '<div class="card">' +
      '<h3>' + t('sleep_phases') + '</h3>' +
      '<div class="phases-chart">' +
        '<div class="phase-bar">' +
          '<div class="phase-seg deep" style="width:' + Math.round(((phases.deep||0)/total)*100) + '%"></div>' +
          '<div class="phase-seg light" style="width:' + Math.round(((phases.light||0)/total)*100) + '%"></div>' +
          '<div class="phase-seg rem" style="width:' + Math.round(((phases.rem||0)/total)*100) + '%"></div>' +
          '<div class="phase-seg awake" style="width:' + Math.round(((phases.awake||0)/total)*100) + '%"></div>' +
        '</div>' +
        '<div class="phase-legend">' +
          '<span class="phase-dot deep"></span>' + t('sleep_deep') + ' ' + (phases.deep||0) + 'h ' +
          '<span class="phase-dot light"></span>' + t('sleep_light') + ' ' + (phases.light||0) + 'h ' +
          '<span class="phase-dot rem"></span>' + t('sleep_rem') + ' ' + (phases.rem||0) + 'h ' +
          '<span class="phase-dot awake"></span>' + t('sleep_awake') + ' ' + (phases.awake||0) + 'h' +
        '</div>' +
      '</div>' +
    '</div>';
}

function selectQuality(btn) {
  document.querySelectorAll('.quality-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
}

async function logSleep() {
  var bedInput = document.getElementById('sleep-bed');
  var wakeInput = document.getElementById('sleep-wake');
  if (!bedInput || !wakeInput) return;
  var bed = bedInput.value;
  var wake = wakeInput.value;
  var [bh, bm] = bed.split(':').map(Number);
  var [wh, wm] = wake.split(':').map(Number);
  var bedMins = bh * 60 + bm;
  var wakeMins = wh * 60 + wm;
  var durationMins = wakeMins >= bedMins ? wakeMins - bedMins : (1440 - bedMins + wakeMins);
  var hours = Math.floor(durationMins / 60);
  var mins = durationMins % 60;

  // Estimate phases based on duration
  var deepH = Math.max(0, Math.round(hours * 0.2));
  var remH = Math.max(0, Math.round(hours * 0.25));
  var lightH = Math.max(0, Math.round(hours * 0.45));
  var awakeH = Math.max(0, hours - deepH - remH - lightH);
  var phases = { deep: deepH, light: lightH, rem: remH, awake: awakeH };

  var addPts = 10 + Math.min(10, hours);
  var newPts = (NX.user.pts || 0) + addPts;
  var levelData = calcLevel(NX.user.level || 1, NX.user.level_pts || 0, addPts, NX.user.level_max || 100);
  var update = {
    sleep_h: hours,
    sleep_m: mins,
    sleep_phases: JSON.stringify(phases),
    pts: newPts,
    level: levelData.level,
    level_pts: levelData.level_pts,
    level_max: levelData.level_max,
  };
  await sb('PATCH', 'users?id=eq.' + NX.user.id, update);
  patchUser(update);
  showToast('Sleep logged! ' + hours + 'h ' + mins + 'm · +' + addPts + ' pts', 'success');
  renderSleep();
}

// ========== WATER ==========
function renderWater() {
  var el = document.getElementById('view-water');
  if (!el || !NX.user) return;
  var u = NX.user;
  var count = u.water_count || 0;
  var goal = 8;
  var pct = Math.min(100, Math.round((count / goal) * 100));

  el.innerHTML =
    '<div class="view-header"><h2>' + t('water_title') + '</h2></div>' +
    '<div class="tracker-hero water-hero">' +
      '<div class="water-bottle">' +
        '<div class="bottle-fill" style="height:' + pct + '%"></div>' +
        '<div class="bottle-label">' + pct + '%</div>' +
      '</div>' +
      '<div class="water-stats">' +
        '<div class="water-count">' + count + '<span> / ' + goal + '</span></div>' +
        '<div class="water-unit">cups today</div>' +
        (count >= goal ? '<div class="goal-badge">' + t('water_congrats') + '</div>' : '') +
      '</div>' +
    '</div>' +
    '<div class="water-cups-grid">' +
      Array.from({ length: goal }, function(_, i) {
        return '<div class="water-cup' + (i < count ? ' filled' : '') + '" onclick="setWaterCups(' + (i+1) + ')" title="Cup ' + (i+1) + '">' +
          '<svg viewBox="0 0 40 50" width="48" height="60"><path d="M6 5 L4 45 Q4 48 8 48 L32 48 Q36 48 36 45 L34 5 Z" fill="' + (i < count ? '#06b6d4' : 'none') + '" stroke="' + (i < count ? '#0891b2' : 'var(--border)') + '" stroke-width="2"/><path d="M10 5 L8 42" fill="none" stroke="white" stroke-width="1" opacity="0.3"/></svg>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<div class="water-actions">' +
      '<button class="btn btn-outline" onclick="adjustWater(-1)">- ' + t('water_remove') + '</button>' +
      '<button class="btn btn-primary btn-lg" onclick="adjustWater(1)">+ ' + t('water_add') + '</button>' +
    '</div>' +
    '<div class="card" style="margin-top:1rem">' +
      '<div class="water-tip">💡 Aim for 8 cups (2L) per day. Your body will thank you!</div>' +
    '</div>';
}

async function adjustWater(delta) {
  if (!NX.user) return;
  var count = Math.max(0, (NX.user.water_count || 0) + delta);
  var addPts = delta > 0 ? 5 : 0;
  var newPts = (NX.user.pts || 0) + addPts;
  var levelData = calcLevel(NX.user.level || 1, NX.user.level_pts || 0, addPts, NX.user.level_max || 100);
  var update = {
    water_count: count,
    pts: newPts,
    level: levelData.level,
    level_pts: levelData.level_pts,
    level_max: levelData.level_max,
  };
  await sb('PATCH', 'users?id=eq.' + NX.user.id, update);
  patchUser(update);
  if (delta > 0 && count === 8) showToast(t('water_congrats'), 'success');
  else if (delta > 0) showToast('Water logged! +5 pts 💧', 'success');
  renderWater();
}

async function setWaterCups(count) {
  if (!NX.user) return;
  var prev = NX.user.water_count || 0;
  var delta = count - prev;
  var addPts = delta > 0 ? delta * 5 : 0;
  var newPts = (NX.user.pts || 0) + addPts;
  var levelData = calcLevel(NX.user.level || 1, NX.user.level_pts || 0, addPts, NX.user.level_max || 100);
  var update = {
    water_count: count,
    pts: newPts,
    level: levelData.level,
    level_pts: levelData.level_pts,
    level_max: levelData.level_max,
  };
  await sb('PATCH', 'users?id=eq.' + NX.user.id, update);
  patchUser(update);
  if (count >= 8) showToast(t('water_congrats'), 'success');
  renderWater();
}
