function t(key) {
  var lang = NX.lang || 'EN';
  var dict = TRANSLATIONS[lang] || TRANSLATIONS['EN'];
  return dict[key] || TRANSLATIONS['EN'][key] || key;
}

function setLang(code) {
  NX.lang = code;
  localStorage.setItem('nx_lang', code);
  if (code === 'AR') {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', code.toLowerCase());
  }
  applyLang();
}

function applyLang() {
  document.querySelectorAll('[data-t]').forEach(function(el) {
    var key = el.getAttribute('data-t');
    var attr = el.getAttribute('data-t-attr');
    if (attr) {
      el.setAttribute(attr, t(key));
    } else {
      el.textContent = t(key);
    }
  });
  document.querySelectorAll('[data-t-ph]').forEach(function(el) {
    el.placeholder = t(el.getAttribute('data-t-ph'));
  });
  var sel = document.getElementById('lang-selector-current');
  if (sel) sel.textContent = NX.lang;
  if (NX.view) {
    var viewRenders = {
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
    if (viewRenders[NX.view]) viewRenders[NX.view]();
  }
}

function buildLangSelector() {
  var langs = [
    { code: 'EN', label: 'English', flag: '🇬🇧' },
    { code: 'ID', label: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ES', label: 'Español', flag: '🇪🇸' },
    { code: 'FR', label: 'Français', flag: '🇫🇷' },
    { code: 'AR', label: 'العربية', flag: '🇸🇦' },
  ];
  var container = document.getElementById('lang-selector');
  if (!container) return;
  var current = langs.find(function(l) { return l.code === NX.lang; }) || langs[0];
  container.innerHTML = '<div class="lang-btn" onclick="toggleLangMenu()">' +
    '<span>' + current.flag + '</span>' +
    '<span id="lang-selector-current">' + NX.lang + '</span>' +
    '<span class="lang-caret">▾</span>' +
    '</div>' +
    '<div class="lang-menu" id="lang-menu" style="display:none">' +
    langs.map(function(l) {
      return '<div class="lang-option' + (l.code === NX.lang ? ' active' : '') + '" onclick="setLang(\'' + l.code + '\');toggleLangMenu()">' +
        l.flag + ' ' + l.label + '</div>';
    }).join('') +
    '</div>';
}

function toggleLangMenu() {
  var menu = document.getElementById('lang-menu');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', function(e) {
  var sel = document.getElementById('lang-selector');
  if (sel && !sel.contains(e.target)) {
    var menu = document.getElementById('lang-menu');
    if (menu) menu.style.display = 'none';
  }
});
