async function signup(email, password, username) {
  email = email.trim().toLowerCase();
  username = username.trim();
  if (!email || !email.includes('@')) throw new Error(t('auth_invalid_email'));
  if (password.length < 6) throw new Error(t('auth_short_pw'));
  if (!username) throw new Error('Username is required');

  // Check email uniqueness
  var existing = await sb('GET', 'users?email=eq.' + encodeURIComponent(email) + '&select=id');
  if (existing && existing.length > 0) throw new Error(t('auth_email_taken'));

  // Check username uniqueness
  var existingU = await sb('GET', 'users?username=eq.' + encodeURIComponent(username) + '&select=id');
  if (existingU && existingU.length > 0) throw new Error(t('auth_username_taken'));

  var hash = await hashPw(password);
  var now = new Date().toISOString().split('T')[0];

  var newUser = {
    email: email,
    password_hash: hash,
    username: username,
    profile: JSON.stringify({ bio: '', avatar: '', joined: now }),
    pts: 0,
    level: 1,
    level_pts: 0,
    level_max: 100,
    streak: 0,
    companion: JSON.stringify({ name: 'Buddy', image: '', traits: [], comp_mode: 'premade', premade_id: 0 }),
    steps: 0,
    sleep_h: 0,
    sleep_m: 0,
    water_count: 0,
    hourly_steps: JSON.stringify(new Array(24).fill(0)),
    sleep_phases: JSON.stringify({ deep: 0, light: 0, rem: 0, awake: 0 }),
    weekly_steps: JSON.stringify([0, 0, 0, 0, 0, 0, 0]),
    comp_mode: 'premade',
    trait_owned: JSON.stringify([]),
  };

  var result = await sb('POST', 'users', newUser);
  var user = Array.isArray(result) ? result[0] : result;
  saveSession(user);
  return user;
}

async function signin(email, password) {
  email = email.trim().toLowerCase();
  if (!email || !email.includes('@')) throw new Error(t('auth_invalid_email'));

  var hash = await hashPw(password);
  var users = await sb('GET', 'users?email=eq.' + encodeURIComponent(email) + '&select=*');

  if (!users || users.length === 0) throw new Error(t('auth_wrong_creds'));
  var user = users[0];
  if (user.password_hash !== hash) throw new Error(t('auth_wrong_creds'));

  // Update streak logic
  user = await updateStreak(user);
  saveSession(user);
  return user;
}

async function updateStreak(user) {
  var profile;
  try { profile = JSON.parse(user.profile || '{}'); } catch(e) { profile = {}; }
  var today = new Date().toISOString().split('T')[0];
  var lastLogin = profile.last_login || '';
  var streak = user.streak || 0;

  if (lastLogin === today) return user;

  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastLogin === yesterdayStr) {
    streak += 1;
  } else if (lastLogin !== today) {
    streak = 1;
  }

  profile.last_login = today;
  var ptsBonus = streak >= 7 ? 10 : streak >= 3 ? 5 : 2;
  var newPts = (user.pts || 0) + ptsBonus;
  var levelData = calcLevel(user.level || 1, user.level_pts || 0, ptsBonus, user.level_max || 100);

  await sb('PATCH', 'users?id=eq.' + user.id, {
    streak: streak,
    profile: JSON.stringify(profile),
    pts: newPts,
    level: levelData.level,
    level_pts: levelData.level_pts,
    level_max: levelData.level_max,
  });

  return Object.assign({}, user, {
    streak: streak,
    profile: JSON.stringify(profile),
    pts: newPts,
    level: levelData.level,
    level_pts: levelData.level_pts,
    level_max: levelData.level_max,
  });
}

function calcLevel(level, levelPts, addPts, levelMax) {
  levelPts += addPts;
  while (levelPts >= levelMax) {
    levelPts -= levelMax;
    level += 1;
    levelMax = Math.floor(100 * Math.pow(1.15, level - 1));
  }
  return { level: level, level_pts: levelPts, level_max: levelMax };
}

function signout() {
  if (NX.dmInterval) { clearInterval(NX.dmInterval); NX.dmInterval = null; }
  if (NX.clockInterval) { clearInterval(NX.clockInterval); NX.clockInterval = null; }
  clearSession();
  NX.user = null;
  NX.aiMessages = [];
  document.getElementById('app').classList.add('hidden');
  document.getElementById('landing').classList.remove('hidden');
  showToast('Signed out successfully', 'success');
}

async function autoLogin() {
  var session = loadSession();
  if (!session || !session.id) return false;
  // Refresh user data from DB
  try {
    var users = await sb('GET', 'users?id=eq.' + session.id + '&select=*');
    if (!users || users.length === 0) { clearSession(); return false; }
    var user = users[0];
    user = await updateStreak(user);
    saveSession(user);
    NX.user = user;
    return true;
  } catch(e) {
    // Use cached session if network fails
    NX.user = session;
    return true;
  }
}

async function updateProfile(data) {
  if (!NX.user) return;
  await sb('PATCH', 'users?id=eq.' + NX.user.id, data);
  patchUser(data);
}
