function renderFriends() {
  var el = document.getElementById('view-friends');
  if (!el) return;
  el.innerHTML =
    '<div class="view-header"><h2>' + t('friends_title') + '</h2></div>' +
    '<div class="friends-tabs">' +
      '<button class="ftab-btn active" onclick="switchFriendsTab(\'friends\',this)">' + t('friends_list') + '</button>' +
      '<button class="ftab-btn" onclick="switchFriendsTab(\'search\',this)">' + t('friends_search_btn') + '</button>' +
      '<button class="ftab-btn" onclick="switchFriendsTab(\'requests\',this)">' + t('friends_requests') + '</button>' +
      '<button class="ftab-btn" onclick="switchFriendsTab(\'messages\',this)">' + t('friends_messages') + '</button>' +
    '</div>' +
    '<div id="ftab-friends" class="ftab">' + renderFriendsList() + '</div>' +
    '<div id="ftab-search" class="ftab" style="display:none">' + renderFriendsSearch() + '</div>' +
    '<div id="ftab-requests" class="ftab" style="display:none">' + renderFriendRequests() + '</div>' +
    '<div id="ftab-messages" class="ftab dm-panel" style="display:none">' + renderDMPanel() + '</div>';

  loadFriendsList();
  loadFriendRequests();
}

function switchFriendsTab(tab, btn) {
  document.querySelectorAll('.ftab').forEach(function(el) { el.style.display = 'none'; });
  document.querySelectorAll('.ftab-btn').forEach(function(b) { b.classList.remove('active'); });
  var tabEl = document.getElementById('ftab-' + tab);
  if (tabEl) tabEl.style.display = 'block';
  if (btn) btn.classList.add('active');
  NX.friendsTab = tab;
  if (tab === 'messages' && NX.dmFriend) {
    openDM(NX.dmFriend.id, NX.dmFriend.username);
  }
}

function renderFriendsSearch() {
  return '<div class="card">' +
    '<div class="form-row">' +
      '<input type="text" id="friend-search-input" placeholder="' + t('friends_search') + '" onkeydown="if(event.key===\'Enter\')searchFriends()">' +
      '<button class="btn btn-primary" onclick="searchFriends()">' + t('friends_search_btn') + '</button>' +
    '</div>' +
    '<div id="friend-search-results" style="margin-top:1rem"></div>' +
  '</div>';
}

function renderFriendsList() {
  return '<div id="friends-list-container"><div class="loading">' + t('loading') + '</div></div>';
}

function renderFriendRequests() {
  return '<div id="friend-requests-container"><div class="loading">' + t('loading') + '</div></div>';
}

function renderDMPanel() {
  return '<div class="dm-chat-wrap">' +
    '<div class="dm-header" id="dm-header">' +
      '<div class="dm-friend-info">Select a friend to message</div>' +
    '</div>' +
    '<div class="dm-messages" id="dm-messages"></div>' +
    '<div class="dm-input-row">' +
      '<input type="text" id="dm-input" placeholder="' + t('friends_msg_placeholder') + '" onkeydown="if(event.key===\'Enter\')sendDM()">' +
      '<button class="btn btn-primary" onclick="sendDM()">' + t('friends_send') + '</button>' +
    '</div>' +
  '</div>';
}

async function loadFriendsList() {
  if (!NX.user) return;
  var container = document.getElementById('friends-list-container');
  if (!container) return;
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    var friendships = await sb('GET', 'friendships?or=(user_a.eq.' + NX.user.id + ',user_b.eq.' + NX.user.id + ')&select=*');
    if (!friendships || friendships.length === 0) {
      container.innerHTML = '<div class="empty-state">' + t('friends_no_friends') + '</div>';
      return;
    }
    var friendIds = friendships.map(function(f) {
      return f.user_a === NX.user.id ? f.user_b : f.user_a;
    });
    var friends = await sb('GET', 'users?id=in.(' + friendIds.join(',') + ')&select=id,username,profile,pts,level,streak,companion');
    container.innerHTML = friends.map(renderFriendCard).join('');
  } catch(e) {
    container.innerHTML = '<div class="error">' + t('error') + '</div>';
  }
}

function renderFriendCard(user) {
  var comp = {};
  try { comp = JSON.parse(user.companion || '{}'); } catch(e) {}
  var premadeId = comp.premade_id !== undefined ? comp.premade_id : 0;
  var premades = [
    { emoji: '🐱' }, { emoji: '🐶' }, { emoji: '🐰' }, { emoji: '🐻' }, { emoji: '🐲' }
  ];
  var emoji = premades[premadeId] ? premades[premadeId].emoji : '🐱';
  return '<div class="friend-card">' +
    '<div class="friend-avatar">' + (comp.image ? '<img src="' + comp.image + '">' : emoji) + '</div>' +
    '<div class="friend-info">' +
      '<div class="friend-name">@' + user.username + '</div>' +
      '<div class="friend-stats">Lv ' + (user.level || 1) + ' · 🔥 ' + (user.streak || 0) + ' · ' + (user.pts || 0) + ' pts</div>' +
    '</div>' +
    '<button class="btn btn-sm btn-primary" onclick="openDM(\'' + user.id + '\',\'' + user.username + '\')">' + t('friends_dm') + '</button>' +
  '</div>';
}

async function loadFriendRequests() {
  if (!NX.user) return;
  var container = document.getElementById('friend-requests-container');
  if (!container) return;
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    var requests = await sb('GET', 'friend_requests?to_user_id=eq.' + NX.user.id + '&status=eq.pending&select=*');
    if (!requests || requests.length === 0) {
      container.innerHTML = '<div class="empty-state">' + t('friends_no_requests') + '</div>';
      return;
    }
    var fromIds = requests.map(function(r) { return r.from_user_id; });
    var users = await sb('GET', 'users?id=in.(' + fromIds.join(',') + ')&select=id,username');
    container.innerHTML = requests.map(function(req) {
      var user = users.find(function(u) { return u.id === req.from_user_id; }) || {};
      return '<div class="request-card">' +
        '<div class="request-user">@' + (user.username || 'Unknown') + '</div>' +
        '<div class="request-actions">' +
          '<button class="btn btn-sm btn-primary" onclick="acceptFriendRequest(\'' + req.id + '\',\'' + req.from_user_id + '\')">' + t('friends_accept') + '</button>' +
          '<button class="btn btn-sm btn-outline" onclick="declineFriendRequest(\'' + req.id + '\')">' + t('friends_decline') + '</button>' +
        '</div>' +
      '</div>';
    }).join('');
  } catch(e) {
    container.innerHTML = '<div class="error">' + t('error') + '</div>';
  }
}

async function searchFriends() {
  var input = document.getElementById('friend-search-input');
  var results = document.getElementById('friend-search-results');
  if (!input || !results) return;
  var query = input.value.trim().toLowerCase();
  if (!query || query.length < 2) return;
  results.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    var users = await sb('GET', 'users?username=ilike.*' + encodeURIComponent(query) + '*&select=id,username,profile,level,streak&limit=10');
    if (!users || users.length === 0) {
      results.innerHTML = '<div class="empty-state">No users found</div>';
      return;
    }
    results.innerHTML = users.filter(function(u) {
      return !NX.user || u.id !== NX.user.id;
    }).map(function(user) {
      return '<div class="search-result">' +
        '<div class="friend-info">' +
          '<div class="friend-name">@' + user.username + '</div>' +
          '<div class="friend-stats">Lv ' + (user.level || 1) + ' · 🔥 ' + (user.streak || 0) + '</div>' +
        '</div>' +
        '<button class="btn btn-sm btn-primary" onclick="sendFriendRequest(\'' + user.id + '\',\'' + user.username + '\')">' + t('friends_add') + '</button>' +
      '</div>';
    }).join('');
  } catch(e) {
    results.innerHTML = '<div class="error">' + t('error') + '</div>';
  }
}

async function sendFriendRequest(toUserId, toUsername) {
  if (!NX.user) return;
  try {
    await sb('POST', 'friend_requests', { from_user_id: NX.user.id, to_user_id: toUserId, status: 'pending' });
    showToast(t('friends_request_sent'), 'success');
  } catch(e) {
    showToast('Request already sent or already friends', 'error');
  }
}

async function acceptFriendRequest(requestId, fromUserId) {
  if (!NX.user) return;
  try {
    await sb('PATCH', 'friend_requests?id=eq.' + requestId, { status: 'accepted' });
    await sb('POST', 'friendships', { user_a: NX.user.id, user_b: fromUserId });
    showToast('Friend added! 🎉', 'success');
    loadFriendRequests();
    loadFriendsList();
  } catch(e) {
    showToast(t('error'), 'error');
  }
}

async function declineFriendRequest(requestId) {
  try {
    await sb('PATCH', 'friend_requests?id=eq.' + requestId, { status: 'declined' });
    loadFriendRequests();
  } catch(e) {}
}

async function openDM(friendId, friendUsername) {
  NX.dmFriend = { id: friendId, username: friendUsername };
  switchFriendsTab('messages', document.querySelector('.ftab-btn:last-child'));

  var header = document.getElementById('dm-header');
  if (header) {
    header.innerHTML = '<div class="dm-friend-info"><strong>@' + friendUsername + '</strong></div>';
  }

  await loadDMMessages();
  if (NX.dmInterval) clearInterval(NX.dmInterval);
  NX.dmInterval = setInterval(loadDMMessages, 3000);
}

async function loadDMMessages() {
  if (!NX.user || !NX.dmFriend) return;
  var container = document.getElementById('dm-messages');
  if (!container) return;
  try {
    var msgs = await sb('GET',
      'messages?or=(and(from_user_id.eq.' + NX.user.id + ',to_user_id.eq.' + NX.dmFriend.id + '),' +
      'and(from_user_id.eq.' + NX.dmFriend.id + ',to_user_id.eq.' + NX.user.id + '))' +
      '&order=created_at.asc&select=*');
    var wasAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 30;
    container.innerHTML = (msgs || []).map(function(msg) {
      var isMe = msg.from_user_id === NX.user.id;
      var time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return '<div class="dm-msg ' + (isMe ? 'me' : 'them') + '">' +
        '<div class="dm-bubble">' + msg.content + '</div>' +
        '<div class="dm-time">' + time + '</div>' +
      '</div>';
    }).join('');
    if (wasAtBottom) container.scrollTop = container.scrollHeight;
  } catch(e) {}
}

async function sendDM() {
  if (!NX.user || !NX.dmFriend) return;
  var input = document.getElementById('dm-input');
  if (!input || !input.value.trim()) return;
  var content = input.value.trim();
  input.value = '';
  try {
    await sb('POST', 'messages', { from_user_id: NX.user.id, to_user_id: NX.dmFriend.id, content: content });
    loadDMMessages();
  } catch(e) {
    input.value = content;
    showToast(t('error'), 'error');
  }
}
