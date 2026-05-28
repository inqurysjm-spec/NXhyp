var NX = {
  user: null,
  view: 'dashboard',
  lang: localStorage.getItem('nx_lang') || 'EN',
  theme: localStorage.getItem('nx_theme') || 'dark',
  dmInterval: null,
  aiMessages: [],
  aiKey: localStorage.getItem('nx_ai_key') || '',
  onboardStep: 1,
  canvasMode: 'draw',
  canvasColor: '#7c3aed',
  canvasBrush: 8,
  canvasErasing: false,
  communityFilter: 'all',
  friendsTab: 'friends',
  dmFriend: null,
  dmMessages: [],
  clockInterval: null,
};

function saveSession(user) {
  NX.user = user;
  localStorage.setItem('nx_session', JSON.stringify(user));
}

function clearSession() {
  NX.user = null;
  localStorage.removeItem('nx_session');
}

function loadSession() {
  try {
    var s = localStorage.getItem('nx_session');
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}

function patchUser(data) {
  if (!NX.user) return;
  Object.assign(NX.user, data);
  localStorage.setItem('nx_session', JSON.stringify(NX.user));
}
