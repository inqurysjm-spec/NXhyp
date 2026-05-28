// ── AUTH MODAL ──
function openAuthModal(tab) {
  var modal = document.getElementById('auth-overlay');
  if (modal) modal.classList.remove('hidden');
  switchAuthTab(tab || 'signin');
}
function closeAuthModal() {
  var modal = document.getElementById('auth-overlay');
  if (modal) modal.classList.add('hidden');
}
function switchAuthTab(tab) {
  var signin = document.getElementById('signin-form');
  var signup = document.getElementById('signup-form');
  document.querySelectorAll('.auth-tab').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  if (signin) signin.classList.toggle('hidden', tab !== 'signin');
  if (signup) signup.classList.toggle('hidden', tab !== 'signup');
}

// ── OPEN / CLOSE APP ──
function openApp() {
  document.getElementById('landing').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
}
function closeApp() {
  if (NX.dmInterval) { clearInterval(NX.dmInterval); NX.dmInterval = null; }
  document.getElementById('app').classList.add('hidden');
  document.getElementById('landing').classList.remove('hidden');
}

// ── NAVIGATION ──
function goTo(view) {
  NX.view = view;
  document.querySelectorAll('.view').forEach(function(el) { el.classList.add('hidden'); });
  var viewEl = document.getElementById('view-' + view);
  if (viewEl) viewEl.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  document.querySelectorAll('.sidebar-item').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  var renders = {
    dashboard: renderDashboard,
    steps: renderSteps,
    sleep: renderSleep,
    water: renderWater,
    companion: renderCompanion,
    ai: renderAI,
    friends: renderFriends,
    community: renderCommunity,
    profile: renderProfile,
  };
  if (renders[view]) renders[view]();

  // Stop DM polling when leaving friends
  if (view !== 'friends' && NX.dmInterval) {
    clearInterval(NX.dmInterval);
    NX.dmInterval = null;
  }
}

// ── NAV BUILD ──
var NAV_ITEMS = [
  { view: 'dashboard', icon: '🏠', labelKey: 'nav_dashboard' },
  { view: 'steps',     icon: '👟', labelKey: 'nav_steps' },
  { view: 'sleep',     icon: '😴', labelKey: 'nav_sleep' },
  { view: 'water',     icon: '💧', labelKey: 'nav_water' },
  { view: 'companion', icon: '🐾', labelKey: 'nav_companion' },
  { view: 'ai',        icon: '💬', labelKey: 'nav_ai' },
  { view: 'friends',   icon: '👥', labelKey: 'nav_friends' },
  { view: 'community', icon: '🌐', labelKey: 'nav_community' },
  { view: 'profile',   icon: '👤', labelKey: 'nav_profile' },
];
var BOTTOM_NAV_ITEMS = [
  { view: 'dashboard', icon: '🏠', labelKey: 'nav_dashboard' },
  { view: 'companion', icon: '🐾', labelKey: 'nav_companion' },
  { view: 'community', icon: '🌐', labelKey: 'nav_community' },
  { view: 'friends',   icon: '👥', labelKey: 'nav_friends' },
  { view: 'profile',   icon: '👤', labelKey: 'nav_profile' },
];

function buildNav() {
  var sidebar = document.getElementById('sidebar-nav');
  if (sidebar) {
    sidebar.innerHTML = NAV_ITEMS.map(function(item) {
      return '<button class="sidebar-item' + (NX.view === item.view ? ' active' : '') + '" data-view="' + item.view + '" onclick="goTo(\'' + item.view + '\')">' +
        '<span class="nav-icon">' + item.icon + '</span>' +
        '<span class="nav-label">' + t(item.labelKey) + '</span>' +
      '</button>';
    }).join('');
  }

  var bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) {
    bottomNav.innerHTML = BOTTOM_NAV_ITEMS.map(function(item) {
      return '<button class="nav-item' + (NX.view === item.view ? ' active' : '') + '" data-view="' + item.view + '" onclick="goTo(\'' + item.view + '\')">' +
        '<span class="nav-icon">' + item.icon + '</span>' +
        '<span class="nav-label">' + t(item.labelKey) + '</span>' +
      '</button>';
    }).join('');
  }
}

// ── CLOCK ──
function startClock() {
  function tick() {
    var clock = document.getElementById('clock');
    if (!clock) return;
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    clock.textContent = h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
  }
  tick();
  if (NX.clockInterval) clearInterval(NX.clockInterval);
  NX.clockInterval = setInterval(tick, 30000);
}

// ── TOASTS ──
function showToast(msg, type) {
  type = type || 'info';
  var container = document.getElementById('toast-container');
  if (!container) return;
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(function() { toast.classList.add('show'); }, 10);
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, 3000);
}

// ── ONBOARDING ──
function showOnboarding() {
  document.getElementById('onboarding').classList.remove('hidden');
  document.getElementById('main-app').classList.add('hidden');
  NX.onboardStep = 1;
  showOnboardStep(1);
}

function showOnboardStep(step) {
  NX.onboardStep = step;
  for (var i = 1; i <= 4; i++) {
    var el = document.getElementById('onboard-step-' + i);
    if (el) el.classList.toggle('hidden', i !== step);
  }
}

function nextOnboardStep() {
  if (NX.onboardStep < 4) {
    showOnboardStep(NX.onboardStep + 1);
  } else {
    finishOnboarding();
  }
}

function finishOnboarding() {
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  buildNav();
  startClock();
  buildLangSelector();
  goTo('dashboard');
}

function showMainApp() {
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  buildNav();
  startClock();
  buildLangSelector();
  goTo('dashboard');
}

// ── AUTH HANDLERS ──
async function handleSignup() {
  var email = document.getElementById('signup-email').value.trim();
  var password = document.getElementById('signup-password').value;
  var confirmPw = document.getElementById('signup-confirm-pw') ? document.getElementById('signup-confirm-pw').value : password;
  var username = document.getElementById('signup-username') ? document.getElementById('signup-username').value.trim() : email.split('@')[0];

  if (password !== confirmPw) { showToast(t('auth_pw_mismatch'), 'error'); return; }

  var btn = document.getElementById('signup-btn');
  if (btn) { btn.disabled = true; btn.textContent = t('loading'); }

  try {
    var user = await signup(email, password, username);
    NX.user = user;
    closeAuthModal();
    openApp();
    showToast('Welcome to NXhyp! 🎉', 'success');
    showOnboarding();
  } catch(e) {
    showToast(e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('auth_submit_up'); }
  }
}

async function handleSignin() {
  var email = document.getElementById('signin-email').value.trim();
  var password = document.getElementById('signin-password').value;

  var btn = document.getElementById('signin-btn');
  if (btn) { btn.disabled = true; btn.textContent = t('loading'); }

  try {
    var user = await signin(email, password);
    NX.user = user;
    closeAuthModal();
    openApp();
    showToast('Welcome back, ' + user.username + '! 👋', 'success');
    showMainApp();
  } catch(e) {
    showToast(e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('auth_submit_in'); }
  }
}

// ── INIT ──
async function initApp() {
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', NX.theme);
  // Apply saved language
  setLang(NX.lang);

  // Check for saved session
  var session = await autoLogin();
  if (session) {
    openApp();
    showMainApp();
  }
}

// Start on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
