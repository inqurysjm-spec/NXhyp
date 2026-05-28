var COMM_CATS = [
  { key: 'all',       label: 'comm_filter_all',       icon: '✨', cat: null },
  { key: 'fitness',   label: 'comm_filter_fitness',   icon: '💪', cat: 'Fitness' },
  { key: 'sleep',     label: 'comm_filter_sleep',     icon: '😴', cat: 'Sleep' },
  { key: 'hydration', label: 'comm_filter_hydration', icon: '💧', cat: 'Hydration' },
  { key: 'nutrition', label: 'comm_filter_nutrition', icon: '🥗', cat: 'Nutrition' },
  { key: 'mental',    label: 'comm_filter_mental',    icon: '🧘', cat: 'Mental' },
  { key: 'goals',     label: 'comm_filter_goals',     icon: '🏆', cat: 'Goals' },
];

function renderCommunity() {
  var el = document.getElementById('view-community');
  if (!el) return;
  el.innerHTML =
    '<div class="view-header">' +
      '<h2>' + t('comm_title') + '</h2>' +
      '<button class="btn btn-primary btn-sm" onclick="openNewPost()">' + t('comm_new_post') + '</button>' +
    '</div>' +
    '<div class="comm-filters">' +
      COMM_CATS.map(function(cat) {
        return '<button class="comm-filter' + (NX.communityFilter === cat.key ? ' active' : '') + '" onclick="setCommunityFilter(\'' + cat.key + '\')">' +
          cat.icon + ' ' + t(cat.label) + '</button>';
      }).join('') +
    '</div>' +
    '<div id="new-post-panel" class="card" style="display:none">' +
      '<div class="form-group">' +
        '<select id="post-category">' +
          COMM_CATS.filter(function(c) { return c.cat; }).map(function(c) {
            return '<option value="' + c.cat + '">' + c.icon + ' ' + t(c.label) + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<textarea id="post-content" placeholder="' + t('comm_post_placeholder') + '" rows="3"></textarea>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem">' +
        '<button class="btn btn-primary" onclick="createPost()">' + t('comm_post_btn') + '</button>' +
        '<button class="btn btn-outline" onclick="closeNewPost()">' + t('cancel') + '</button>' +
      '</div>' +
    '</div>' +
    '<div id="community-posts"><div class="loading">' + t('loading') + '</div></div>';

  loadPosts();
}

function openNewPost() {
  var panel = document.getElementById('new-post-panel');
  if (panel) panel.style.display = 'block';
}

function closeNewPost() {
  var panel = document.getElementById('new-post-panel');
  if (panel) panel.style.display = 'none';
}

function setCommunityFilter(key) {
  NX.communityFilter = key;
  document.querySelectorAll('.comm-filter').forEach(function(btn, i) {
    btn.classList.toggle('active', i === COMM_CATS.findIndex(function(c) { return c.key === key; }));
  });
  loadPosts();
}

async function loadPosts() {
  var container = document.getElementById('community-posts');
  if (!container) return;
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    var filterCat = COMM_CATS.find(function(c) { return c.key === NX.communityFilter; });
    var path = 'community_posts?order=created_at.desc&select=*&limit=30';
    if (filterCat && filterCat.cat) {
      path += '&cat=eq.' + encodeURIComponent(filterCat.cat);
    }
    var posts = await sb('GET', path);
    if (!posts || posts.length === 0) {
      container.innerHTML = '<div class="empty-state">' + t('comm_no_posts') + '</div>';
      return;
    }

    // Load my likes
    var myLikeIds = new Set();
    if (NX.user && posts.length > 0) {
      var postIds = posts.map(function(p) { return p.id; });
      try {
        var myLikes = await sb('GET', 'post_likes?user_id=eq.' + NX.user.id + '&post_id=in.(' + postIds.join(',') + ')&select=post_id');
        if (myLikes) myLikes.forEach(function(l) { myLikeIds.add(l.post_id); });
      } catch(e) {}
    }

    container.innerHTML = posts.map(function(post) {
      return renderPost(post, myLikeIds.has(post.id));
    }).join('');
  } catch(e) {
    container.innerHTML = '<div class="error">' + t('error') + '</div>';
  }
}

function renderPost(post, isLiked) {
  var catInfo = COMM_CATS.find(function(c) { return c.cat === post.cat; });
  var catIcon = catInfo ? catInfo.icon : '💬';
  var time = new Date(post.created_at).toLocaleDateString();
  return '<div class="post-card" id="post-' + post.id + '">' +
    '<div class="post-header">' +
      '<span class="post-cat">' + catIcon + ' ' + post.cat + '</span>' +
      '<span class="post-time">' + time + '</span>' +
    '</div>' +
    '<div class="post-content">' + post.content + '</div>' +
    '<div class="post-actions">' +
      '<button class="like-btn' + (isLiked ? ' liked' : '') + '" onclick="toggleLike(\'' + post.id + '\',' + isLiked + ',' + (post.likes || 0) + ',this)">' +
        (isLiked ? '❤️' : '🤍') + ' <span class="like-count">' + (post.likes || 0) + '</span>' +
      '</button>' +
      '<button class="reply-btn" onclick="toggleReplies(\'' + post.id + '\')">' +
        '💬 ' + t('comm_reply') +
      '</button>' +
    '</div>' +
    '<div id="replies-' + post.id + '" class="post-replies" style="display:none">' +
      '<div class="loading">' + t('loading') + '</div>' +
    '</div>' +
    '<div id="reply-form-' + post.id + '" class="reply-form" style="display:none">' +
      '<div class="form-row">' +
        '<input type="text" id="reply-input-' + post.id + '" placeholder="' + t('comm_reply_placeholder') + '" onkeydown="if(event.key===\'Enter\')addReply(\'' + post.id + '\')">' +
        '<button class="btn btn-sm btn-primary" onclick="addReply(\'' + post.id + '\')">' + t('comm_reply') + '</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

async function toggleLike(postId, wasLiked, currentCount, btn) {
  if (!NX.user) { showToast('Sign in to like posts', 'error'); return; }
  try {
    var newCount;
    if (wasLiked) {
      await sb('DELETE', 'post_likes?user_id=eq.' + NX.user.id + '&post_id=eq.' + postId);
      newCount = Math.max(0, currentCount - 1);
      await sb('PATCH', 'community_posts?id=eq.' + postId, { likes: newCount });
      btn.classList.remove('liked');
      btn.innerHTML = '🤍 <span class="like-count">' + newCount + '</span>';
      btn.setAttribute('onclick', 'toggleLike(\'' + postId + '\',false,' + newCount + ',this)');
    } else {
      await sb('POST', 'post_likes', { user_id: NX.user.id, post_id: postId });
      newCount = currentCount + 1;
      await sb('PATCH', 'community_posts?id=eq.' + postId, { likes: newCount });
      btn.classList.add('liked');
      btn.innerHTML = '❤️ <span class="like-count">' + newCount + '</span>';
      btn.setAttribute('onclick', 'toggleLike(\'' + postId + '\',true,' + newCount + ',this)');
    }
  } catch(e) {}
}

async function toggleReplies(postId) {
  var repliesEl = document.getElementById('replies-' + postId);
  var formEl = document.getElementById('reply-form-' + postId);
  if (!repliesEl) return;
  var isShown = repliesEl.style.display !== 'none';
  repliesEl.style.display = isShown ? 'none' : 'block';
  if (formEl) formEl.style.display = isShown ? 'none' : 'block';
  if (!isShown) {
    await loadReplies(postId);
  }
}

async function loadReplies(postId) {
  var container = document.getElementById('replies-' + postId);
  if (!container) return;
  container.innerHTML = '<div class="loading">' + t('loading') + '</div>';
  try {
    var replies = await sb('GET', 'post_replies?post_id=eq.' + postId + '&order=created_at.asc&select=*');
    if (!replies || replies.length === 0) {
      container.innerHTML = '<div class="empty-state" style="font-size:0.8rem">No replies yet.</div>';
      return;
    }
    var userIds = [...new Set(replies.map(function(r) { return r.user_id; }))];
    var users = await sb('GET', 'users?id=in.(' + userIds.join(',') + ')&select=id,username');
    var userMap = {};
    (users || []).forEach(function(u) { userMap[u.id] = u.username; });

    container.innerHTML = replies.map(function(reply) {
      var username = userMap[reply.user_id] || 'Anonymous';
      var isMe = NX.user && reply.user_id === NX.user.id;
      var time = new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return '<div class="reply-card' + (isMe ? ' my-reply' : '') + '">' +
        '<div class="reply-header">' +
          '<span class="reply-user">@' + username + (isMe ? ' (you)' : '') + '</span>' +
          '<span class="reply-time">' + time + '</span>' +
        '</div>' +
        '<div class="reply-content">' + reply.content + '</div>' +
      '</div>';
    }).join('');
  } catch(e) {
    container.innerHTML = '<div class="error">' + t('error') + '</div>';
  }
}

async function addReply(postId) {
  if (!NX.user) { showToast('Sign in to reply', 'error'); return; }
  var input = document.getElementById('reply-input-' + postId);
  if (!input || !input.value.trim()) return;
  var content = input.value.trim();
  input.value = '';
  try {
    await sb('POST', 'post_replies', { post_id: postId, user_id: NX.user.id, content: content });
    var addPts = 15;
    var newPts = (NX.user.pts || 0) + addPts;
    var levelData = calcLevel(NX.user.level || 1, NX.user.level_pts || 0, addPts, NX.user.level_max || 100);
    var update = { pts: newPts, level: levelData.level, level_pts: levelData.level_pts, level_max: levelData.level_max };
    await sb('PATCH', 'users?id=eq.' + NX.user.id, update);
    patchUser(update);
    showToast('+15 pts for contributing! 🤝', 'success');
    loadReplies(postId);
  } catch(e) {
    input.value = content;
    showToast(t('error'), 'error');
  }
}

async function createPost() {
  if (!NX.user) { showToast('Sign in to post', 'error'); return; }
  var catEl = document.getElementById('post-category');
  var contentEl = document.getElementById('post-content');
  if (!catEl || !contentEl) return;
  var cat = catEl.value;
  var content = contentEl.value.trim();
  if (!content) return;
  try {
    await sb('POST', 'community_posts', { user_id: NX.user.id, cat: cat, content: content, likes: 0 });
    contentEl.value = '';
    closeNewPost();
    var addPts = 5;
    var newPts = (NX.user.pts || 0) + addPts;
    var levelData = calcLevel(NX.user.level || 1, NX.user.level_pts || 0, addPts, NX.user.level_max || 100);
    var update = { pts: newPts, level: levelData.level, level_pts: levelData.level_pts, level_max: levelData.level_max };
    await sb('PATCH', 'users?id=eq.' + NX.user.id, update);
    patchUser(update);
    showToast('Posted! +5 pts 🌸', 'success');
    loadPosts();
  } catch(e) {
    showToast(t('error'), 'error');
  }
}

function renderProfile() {
  var el = document.getElementById('view-profile');
  if (!el || !NX.user) return;
  var u = NX.user;
  var profile = {};
  try { profile = JSON.parse(u.profile || '{}'); } catch(e) {}
  el.innerHTML =
    '<div class="view-header"><h2>' + t('prof_title') + '</h2></div>' +
    '<div class="profile-card card">' +
      '<div class="profile-avatar" id="profile-avatar-display"></div>' +
      '<div class="profile-info">' +
        '<div class="profile-name">@' + u.username + '</div>' +
        '<div class="profile-email">' + u.email + '</div>' +
        '<div class="profile-level">Lv ' + (u.level || 1) + ' · 🔥 ' + (u.streak || 0) + ' days</div>' +
      '</div>' +
    '</div>' +
    '<div class="card">' +
      '<h3>' + t('prof_stats') + '</h3>' +
      '<div class="stats-list">' +
        '<div class="stat-row"><span>' + t('prof_level') + '</span><strong>' + (u.level || 1) + '</strong></div>' +
        '<div class="stat-row"><span>' + t('prof_pts') + '</span><strong>' + (u.pts || 0) + '</strong></div>' +
        '<div class="stat-row"><span>' + t('prof_streak') + '</span><strong>' + (u.streak || 0) + ' days 🔥</strong></div>' +
        '<div class="stat-row"><span>' + t('prof_total_steps') + '</span><strong>' + (u.steps || 0).toLocaleString() + '</strong></div>' +
        '<div class="stat-row"><span>' + t('prof_avg_sleep') + '</span><strong>' + (u.sleep_h || 0) + 'h ' + (u.sleep_m || 0) + 'm</strong></div>' +
      '</div>' +
    '</div>' +
    '<div class="card">' +
      '<h3>' + t('prof_language') + '</h3>' +
      '<div id="lang-selector"></div>' +
    '</div>' +
    '<div class="card">' +
      '<h3>' + t('prof_theme') + '</h3>' +
      '<div class="theme-btns">' +
        '<button class="btn' + (NX.theme === 'dark' ? ' btn-primary' : ' btn-outline') + '" onclick="setTheme(\'dark\')">' + t('prof_theme_dark') + '</button>' +
        '<button class="btn' + (NX.theme === 'light' ? ' btn-primary' : ' btn-outline') + '" onclick="setTheme(\'light\')">' + t('prof_theme_light') + '</button>' +
      '</div>' +
    '</div>' +
    '<div class="card">' +
      '<h3>' + t('prof_ai_key') + '</h3>' +
      '<div class="form-row">' +
        '<input type="password" id="ai-key-setting" value="' + (NX.aiKey || '') + '" placeholder="sk-ant-...">' +
        '<button class="btn btn-primary" onclick="saveAIKeyFromProfile()">' + t('save') + '</button>' +
      '</div>' +
      '<p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.5rem">Optional. Enables Claude AI responses. Get a key at console.anthropic.com</p>' +
    '</div>' +
    '<div class="card">' +
      '<button class="btn btn-danger" style="width:100%" onclick="signout()">' + t('prof_signout') + '</button>' +
    '</div>';

  renderMiniCompanion('profile-avatar-display');
  buildLangSelector();
}

function saveAIKeyFromProfile() {
  var input = document.getElementById('ai-key-setting');
  if (input) {
    NX.aiKey = input.value.trim();
    localStorage.setItem('nx_ai_key', NX.aiKey);
    showToast('AI key saved!', 'success');
  }
}

function setTheme(theme) {
  NX.theme = theme;
  localStorage.setItem('nx_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  renderProfile();
}
