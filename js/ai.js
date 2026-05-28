var AI_RULES = [
  { match: /step|walk|exercise|activity|move/i, responses: [
    "Great question about steps! Aim for 10,000 steps daily. Based on your current stats, try a 20-minute walk after meals — it really adds up!",
    "Walking is one of the best exercises! Even 30 minutes of brisk walking burns 150-200 calories. Keep those steps coming!",
    "Physical activity is key to health. Break your step goal into chunks: take the stairs, park farther away, or walk during calls.",
  ]},
  { match: /sleep|rest|tired|insomnia|nap/i, responses: [
    "Sleep is crucial for recovery! Adults need 7-9 hours. Try a consistent bedtime routine and keep your room cool and dark.",
    "Poor sleep affects everything — mood, metabolism, even hunger hormones! Your 7-8h target is perfect. Avoid screens 1 hour before bed.",
    "Sleep quality matters as much as quantity. Deep sleep (about 20% of total) is when your body repairs itself. Try a relaxing pre-sleep routine.",
  ]},
  { match: /water|hydrat|drink/i, responses: [
    "Hydration is vital! 8 cups (2L) daily is the standard recommendation. Start your day with a full glass of water — it wakes up your metabolism!",
    "Did you know dehydration can feel like hunger? Next time you feel a craving, try drinking a glass of water first and wait 10 minutes.",
    "Your water intake affects energy, skin, and focus. Try adding lemon or cucumber to make water more enjoyable if you struggle to drink enough.",
  ]},
  { match: /diet|eat|food|nutrition|meal|calori/i, responses: [
    "Nutrition is 80% of health! Focus on whole foods: vegetables, lean proteins, complex carbs. The simpler your plate, the better.",
    "Try the plate method: half vegetables, quarter protein, quarter whole grains. No need to count calories if you eat this way consistently.",
    "Meal prep on Sundays can make healthy eating easy all week. Cook grains and proteins in bulk, then mix and match throughout the week.",
  ]},
  { match: /stress|anxi|mental|mood|feel|depress/i, responses: [
    "Mental health is just as important as physical! Try the 4-7-8 breathing technique: inhale 4s, hold 7s, exhale 8s. It activates the parasympathetic nervous system.",
    "Movement is medicine for the mind. Even a 10-minute walk can reduce anxiety by up to 30%. Your step tracking is helping your mental health too!",
    "Journaling, meditation, and social connection are powerful mental health tools. Your NXhyp community is a great resource for support!",
  ]},
  { match: /weight|lose|fat|bmi|body/i, responses: [
    "Sustainable weight management comes from consistent habits, not crash diets. Focus on your step count, sleep quality, and water intake — the rest follows.",
    "A 500-calorie daily deficit leads to about 0.5kg loss per week. But remember: muscle weighs more than fat — focus on how you feel, not just the scale.",
    "Building healthy habits is more effective than dieting. Your NXhyp streaks and companion system are designed to help you build those habits sustainably!",
  ]},
  { match: /companion|pet|buddy|friend/i, responses: [
    "Your companion reflects your health! Keep up your steps, sleep, and water intake to keep them happy and excited. A happy companion means a healthy you!",
    "Your companion's mood changes based on your daily habits. Reach all three goals today and watch them light up with excitement!",
    "Gamification really works for health! Studies show that reward systems and virtual pets significantly improve adherence to health habits.",
  ]},
  { match: /level|point|pts|xp|reward/i, responses: [
    "You earn points for every healthy action: steps (1pt/100 steps), sleep logging (10pt), water (5pt/cup), and daily streaks! Keep it up!",
    "Leveling up in NXhyp unlocks new companion traits and shows your consistency. The streak bonus gives extra XP after 3 and 7 consecutive days!",
    "Your current level reflects your health journey so far. Each level requires more XP, but you also earn more as your habits improve!",
  ]},
  { match: /tip|advice|help|suggest|improve|better/i, responses: [
    "Here's my top tip: track consistently for 21 days. That's how long it takes to build a habit. Your NXhyp streak is counting! 🔥",
    "The secret to health? Small, consistent actions over time. 5,000 steps is better than no steps. A 6-hour sleep is better than no sleep tracked.",
    "Focus on process, not perfection. Missing one day doesn't break your streak if you get back on track immediately. Be kind to yourself!",
  ]},
];

function renderAI() {
  var el = document.getElementById('view-ai');
  if (!el) return;
  el.innerHTML =
    '<div class="view-header"><h2>' + t('ai_title') + '</h2></div>' +
    '<div class="ai-key-section card" id="ai-key-section" style="' + (NX.aiKey ? 'display:none' : '') + '">' +
      '<p>' + t('ai_key_prompt') + '</p>' +
      '<div class="form-row">' +
        '<input type="password" id="ai-key-input" placeholder="sk-ant-..." value="' + NX.aiKey + '">' +
        '<button class="btn btn-primary" onclick="saveAIKey()">' + t('ai_key_save') + '</button>' +
      '</div>' +
      '<button class="btn btn-sm btn-text" onclick="document.getElementById(\'ai-key-section\').style.display=\'none\'">' + t('cancel') + '</button>' +
    '</div>' +
    '<div class="ai-chat" id="ai-chat">' +
      '<div class="ai-messages" id="ai-messages">' +
        NX.aiMessages.map(renderAIMessage).join('') +
    '</div>' +
    '</div>' +
    '<div class="ai-input-row">' +
      '<button class="btn btn-sm btn-ghost" onclick="document.getElementById(\'ai-key-section\').style.display=\'block\'" title="API Key">🔑</button>' +
      '<input type="text" id="ai-input" placeholder="' + t('ai_placeholder') + '" onkeydown="if(event.key===\'Enter\')sendAI()">' +
      '<button class="btn btn-primary" onclick="sendAI()">' + t('ai_send') + '</button>' +
    '</div>';

  if (NX.aiMessages.length === 0) {
    addAIMessage('assistant', t('ai_greeting'));
  }
  scrollAIToBottom();
}

function renderAIMessage(msg) {
  return '<div class="ai-msg ai-msg-' + msg.role + '">' +
    '<div class="ai-bubble">' + escapeHtml(msg.content).replace(/\n/g, '<br>') + '</div>' +
    '<div class="ai-ts">' + msg.time + '</div>' +
  '</div>';
}

function addAIMessage(role, content) {
  var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  var msg = { role: role, content: content, time: time };
  NX.aiMessages.push(msg);
  var container = document.getElementById('ai-messages');
  if (container) {
    var div = document.createElement('div');
    div.innerHTML = renderAIMessage(msg);
    container.appendChild(div.firstChild);
    scrollAIToBottom();
  }
}

function scrollAIToBottom() {
  var msgs = document.getElementById('ai-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function saveAIKey() {
  var input = document.getElementById('ai-key-input');
  if (input) {
    NX.aiKey = input.value.trim();
    localStorage.setItem('nx_ai_key', NX.aiKey);
    var section = document.getElementById('ai-key-section');
    if (section) section.style.display = 'none';
    showToast('AI key saved!', 'success');
  }
}

async function sendAI() {
  var input = document.getElementById('ai-input');
  if (!input) return;
  var text = input.value.trim();
  if (!text) return;
  input.value = '';
  addAIMessage('user', text);

  if (NX.aiKey && NX.aiKey.startsWith('sk-ant-')) {
    await sendWithClaudeAPI(text);
  } else {
    await sendRuleBased(text);
  }
}

async function sendWithClaudeAPI(userText) {
  var u = NX.user;
  var systemPrompt = 'You are a friendly and encouraging AI health coach for the NXhyp health app. ' +
    'The user\'s current stats: steps today: ' + (u ? u.steps || 0 : 0) + ', ' +
    'sleep last night: ' + (u ? (u.sleep_h || 0) + 'h ' + (u.sleep_m || 0) + 'm' : 'unknown') + ', ' +
    'water cups today: ' + (u ? u.water_count || 0 : 0) + '/8, ' +
    'current streak: ' + (u ? u.streak || 0 : 0) + ' days, ' +
    'level: ' + (u ? u.level || 1 : 1) + '. ' +
    'Give concise, personalized health advice. Be encouraging and practical. Keep responses under 150 words.';

  var thinkingEl = document.createElement('div');
  thinkingEl.className = 'ai-msg ai-msg-assistant ai-thinking';
  thinkingEl.innerHTML = '<div class="ai-bubble"><span class="thinking-dots">...</span></div>';
  var msgs = document.getElementById('ai-messages');
  if (msgs) { msgs.appendChild(thinkingEl); scrollAIToBottom(); }

  try {
    var history = NX.aiMessages.slice(-10).map(function(m) {
      return { role: m.role, content: m.content };
    });
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': NX.aiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: systemPrompt,
        messages: history,
      }),
    });
    if (msgs && thinkingEl.parentNode) msgs.removeChild(thinkingEl);
    if (!res.ok) throw new Error('API error ' + res.status);
    var data = await res.json();
    var reply = data.content && data.content[0] ? data.content[0].text : 'Sorry, I had trouble responding.';
    addAIMessage('assistant', reply);
  } catch(e) {
    if (msgs && thinkingEl.parentNode) msgs.removeChild(thinkingEl);
    await sendRuleBased(userText);
  }
}

async function sendRuleBased(text) {
  await new Promise(function(r) { setTimeout(r, 600 + Math.random() * 800); });
  var u = NX.user;
  var rule = AI_RULES.find(function(r) { return r.match.test(text); });
  var response;
  if (rule) {
    response = rule.responses[Math.floor(Math.random() * rule.responses.length)];
    // Personalize based on user stats
    if (u) {
      if (u.steps < 5000 && /step|walk/i.test(text)) {
        response += '\n\nBased on your stats, you\'re at ' + u.steps.toLocaleString() + ' steps today. You can do it! 💪';
      }
      if (u.water_count < 4 && /water|hydrat/i.test(text)) {
        response += '\n\nYou\'ve had ' + u.water_count + ' cups today — let\'s get that up to 8!';
      }
    }
  } else {
    var generic = [
      "That's a great question! Health is a holistic journey — focus on sleep, movement, hydration, and mental wellbeing consistently.",
      "I'm here to support your health journey! Ask me about steps, sleep, water, nutrition, stress, or anything health-related.",
      "Remember: progress over perfection! Every healthy choice you make today is an investment in tomorrow's you. 🌟",
    ];
    response = generic[Math.floor(Math.random() * generic.length)];
    if (u) response += '\n\nYour current streak is ' + (u.streak||0) + ' days — keep it going!';
  }
  addAIMessage('assistant', response);
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
