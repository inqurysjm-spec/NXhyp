/* ============================================================
   STUDYVERSE — Static data tables
   Destinations, study backgrounds, shop items, quests, bots.
   ============================================================ */

// Map projection helpers use a simple equirectangular layout where
// x = (lon + 180) / 360, y = (90 - lat) / 180  (0..1 each).

window.SV_DATA = (function () {

  // ---- Destinations grouped by trip tier ----------------------------
  // tier: short (25m), medium (50m / train), long (90m+)
  const DESTINATIONS = [
    // short hops
    { id:'oakland',   name:'Oakland',       country:'USA',      flag:'🇺🇸', tier:'short',  miles:12,    lat:37.80, lon:-122.27, mode:'train' },
    { id:'sanjose',   name:'San Jose',      country:'USA',      flag:'🇺🇸', tier:'short',  miles:48,    lat:37.34, lon:-121.89, mode:'train' },
    { id:'sacramento',name:'Sacramento',    country:'USA',      flag:'🇺🇸', tier:'short',  miles:88,    lat:38.58, lon:-121.49, mode:'train' },
    { id:'monterey',  name:'Monterey',      country:'USA',      flag:'🇺🇸', tier:'short',  miles:115,   lat:36.60, lon:-121.89, mode:'train' },
    // medium
    { id:'lasvegas',  name:'Las Vegas',     country:'USA',      flag:'🇺🇸', tier:'medium', miles:417,   lat:36.17, lon:-115.14, mode:'plane' },
    { id:'la',        name:'Los Angeles',   country:'USA',      flag:'🇺🇸', tier:'medium', miles:382,   lat:34.05, lon:-118.24, mode:'plane' },
    { id:'seattle',   name:'Seattle',       country:'USA',      flag:'🇺🇸', tier:'medium', miles:808,   lat:47.61, lon:-122.33, mode:'plane' },
    { id:'chicago',   name:'Chicago',       country:'USA',      flag:'🇺🇸', tier:'medium', miles:1858,  lat:41.88, lon:-87.63,  mode:'plane' },
    { id:'mexico',    name:'Mexico City',   country:'Mexico',   flag:'🇲🇽', tier:'medium', miles:1887,  lat:19.43, lon:-99.13,  mode:'plane' },
    // long haul
    { id:'nyc',       name:'New York',      country:'USA',      flag:'🇺🇸', tier:'long',   miles:2570,  lat:40.71, lon:-74.01,  mode:'plane' },
    { id:'london',    name:'London',        country:'UK',       flag:'🇬🇧', tier:'long',   miles:5367,  lat:51.51, lon:-0.13,   mode:'plane' },
    { id:'paris',     name:'Paris',         country:'France',   flag:'🇫🇷', tier:'long',   miles:5577,  lat:48.86, lon:2.35,    mode:'plane' },
    { id:'tokyo',     name:'Tokyo',         country:'Japan',    flag:'🇯🇵', tier:'long',   miles:5130,  lat:35.68, lon:139.69,  mode:'plane' },
    { id:'jakarta',   name:'Jakarta',       country:'Indonesia',flag:'🇮🇩', tier:'long',   miles:8500,  lat:-6.21, lon:106.85,  mode:'plane' },
    { id:'sydney',    name:'Sydney',        country:'Australia',flag:'🇦🇺', tier:'long',   miles:7416,  lat:-33.87,lon:151.21,  mode:'plane' },
    { id:'cairo',     name:'Cairo',         country:'Egypt',    flag:'🇪🇬', tier:'long',   miles:7634,  lat:30.04, lon:31.24,   mode:'plane' },
    { id:'rio',       name:'Rio de Janeiro',country:'Brazil',   flag:'🇧🇷', tier:'long',   miles:6612,  lat:-22.91,lon:-43.17,  mode:'plane' },
    { id:'capetown',  name:'Cape Town',     country:'S. Africa',flag:'🇿🇦', tier:'long',   miles:10243, lat:-33.92,lon:18.42,   mode:'plane' },
  ];

  const HOME_CITIES = [
    { id:'sf',     name:'San Francisco', lat:37.77, lon:-122.42 },
    { id:'london', name:'London',        lat:51.51, lon:-0.13 },
    { id:'tokyo',  name:'Tokyo',         lat:35.68, lon:139.69 },
    { id:'sydney', name:'Sydney',        lat:-33.87,lon:151.21 },
    { id:'nyc',    name:'New York',      lat:40.71, lon:-74.01 },
    { id:'jakarta',name:'Jakarta',       lat:-6.21, lon:106.85 },
  ];

  // ---- Study background environments --------------------------------
  // sky: [topColor, bottomColor], unlock: {coins} or {visit:cityId} or null
  const BACKGROUNDS = [
    { id:'studyroom', name:'Study Room', emoji:'📚', sky:['#3a3a5c','#23233a'], ambient:'silence', unlock:null,
      desc:'A quiet personal study room. Pure focus.' },
    { id:'library',   name:'Grand Library', emoji:'🏛️', sky:['#5b4636','#2e2418'], ambient:'silence', unlock:null,
      desc:'A grand hall lined with bookshelves and fellow students.' },
    { id:'cafe',      name:'Cozy Cafe', emoji:'☕', sky:['#caa472','#7a5a3a'], ambient:'cafe', unlock:{coins:50},
      desc:'Warm light, the murmur of chatter and clinking cups.' },
    { id:'park',      name:'City Park', emoji:'🌳', sky:['#8fd3f4','#5fb878'], ambient:'birds', unlock:{coins:120},
      desc:'Benches, trees and birdsong on a bright afternoon.' },
    { id:'rooftop',   name:'City Rooftop', emoji:'🌃', sky:['#1a1a3e','#3a2a5e'], ambient:'city', unlock:{coins:250},
      desc:'A glowing night skyline for late-evening sessions.' },
    { id:'beach',     name:'Tropical Beach', emoji:'🏖️', sky:['#7ec8e3','#f6d186'], ambient:'ocean', unlock:{coins:400},
      desc:'Endless ocean waves for marathon focus sessions.' },
    { id:'train',     name:'Train Window', emoji:'🚆', sky:['#9bb7d4','#6b8299'], ambient:'train', unlock:{visit:'chicago'},
      desc:'Scenery streaks past the window of a moving train.' },
    { id:'spaceship', name:'Space Station', emoji:'🚀', sky:['#05030f','#1a0b2e'], ambient:'space', unlock:{streak:5},
      desc:'A futuristic station among the stars. Unlocked at a 5-day streak.' },
  ];

  // ---- Shop items ----------------------------------------------------
  // type: outfit | hair | skin | desk | accessory ; applies color or flag
  const SHOP = [
    // outfits (color)
    { id:'outfit_teal',   type:'outfit', name:'Teal Hoodie',    price:0,   value:'#14b8a6', emoji:'🧥' },
    { id:'outfit_red',    type:'outfit', name:'Crimson Jacket', price:40,  value:'#ef4444', emoji:'🧥' },
    { id:'outfit_purple', type:'outfit', name:'Royal Cloak',    price:80,  value:'#8b5cf6', emoji:'🧥' },
    { id:'outfit_gold',   type:'outfit', name:'Golden Suit',    price:200, value:'#eab308', emoji:'✨' },
    { id:'outfit_space',  type:'outfit', name:'Space Suit',     price:350, value:'#cbd5e1', emoji:'👨‍🚀' },
    // hair colors
    { id:'hair_brown',    type:'hair',   name:'Brown Hair',     price:0,   value:'#6b4423', emoji:'💇' },
    { id:'hair_blonde',   type:'hair',   name:'Blonde Hair',    price:30,  value:'#e8c170', emoji:'💇' },
    { id:'hair_pink',     type:'hair',   name:'Pink Hair',      price:60,  value:'#ec4899', emoji:'💇' },
    { id:'hair_blue',     type:'hair',   name:'Blue Hair',      price:60,  value:'#3b82f6', emoji:'💇' },
    { id:'hair_white',    type:'hair',   name:'Silver Hair',    price:120, value:'#e2e8f0', emoji:'💇' },
    // desk items (accessory flags shown in study scene)
    { id:'desk_plant',    type:'desk',   name:'Desk Plant',     price:25,  value:'plant',  emoji:'🪴' },
    { id:'desk_lamp',     type:'desk',   name:'Study Lamp',     price:35,  value:'lamp',   emoji:'💡' },
    { id:'desk_coffee',   type:'desk',   name:'Coffee Mug',     price:20,  value:'coffee', emoji:'☕' },
    { id:'desk_globe',    type:'desk',   name:'Mini Globe',     price:90,  value:'globe',  emoji:'🌍' },
    // accessories (head)
    { id:'acc_glasses',   type:'accessory', name:'Glasses',     price:45,  value:'glasses', emoji:'👓' },
    { id:'acc_cap',       type:'accessory', name:'Cap',         price:55,  value:'cap',     emoji:'🧢' },
    { id:'acc_crown',     type:'accessory', name:'Crown',       price:300, value:'crown',   emoji:'👑' },
    // background unlocks (purchasable shortcuts)
    { id:'bg_cafe',   type:'background', name:'Cafe Pass',   price:50,  value:'cafe',   emoji:'☕' },
    { id:'bg_park',   type:'background', name:'Park Pass',   price:120, value:'park',   emoji:'🌳' },
    { id:'bg_rooftop',type:'background', name:'Rooftop Pass',price:250, value:'rooftop',emoji:'🌃' },
    { id:'bg_beach',  type:'background', name:'Beach Pass',  price:400, value:'beach',  emoji:'🏖️' },
  ];

  // ---- Quests --------------------------------------------------------
  // metric is matched in app logic; goal = target count
  const QUESTS = [
    { id:'q_sessions3', period:'daily',  text:'Study 3 sessions today',        goal:3,  reward:50,  metric:'sessionsToday' },
    { id:'q_week90',    period:'weekly', text:'Study 90 minutes this week',     goal:90, reward:100, metric:'weekMinutes' },
    { id:'q_streak5',   period:'weekly', text:'Study 5 days in a row',          goal:5,  reward:200, metric:'streak' },
    { id:'q_newcity',   period:'daily',  text:'Fly to a new city',              goal:1,  reward:30,  metric:'newCitiesToday' },
    { id:'q_long90',    period:'daily',  text:'Complete a 90-minute session',   goal:1,  reward:75,  metric:'long90Today' },
    { id:'q_friend',    period:'daily',  text:'Study with a friend',            goal:1,  reward:40,  metric:'friendSessionsToday' },
    { id:'q_chat5',     period:'daily',  text:'Chat with 5 different people',   goal:5,  reward:20,  metric:'chatPeopleToday' },
    { id:'q_bg3',       period:'weekly', text:'Study in 3 different backgrounds',goal:3, reward:60,  metric:'bgVariety' },
    { id:'q_visit10',   period:'all',    text:'Visit 10 countries in passport', goal:10, reward:150, metric:'countriesVisited' },
  ];

  // ---- Simulated community (bots) -----------------------------------
  const BOTS = [
    { id:'b_aiko',   name:'Aiko',    city:'Tokyo',     flag:'🇯🇵', char:{skin:'#f1c27d',hair:'#1a1a1a',outfit:'#ef4444'}, online:true,  minutes:1240 },
    { id:'b_liam',   name:'Liam',    city:'London',    flag:'🇬🇧', char:{skin:'#ffdbac',hair:'#6b4423',outfit:'#3b82f6'}, online:true,  minutes:880 },
    { id:'b_sofia',  name:'Sofia',   city:'Madrid',    flag:'🇪🇸', char:{skin:'#e0ac69',hair:'#1a1a1a',outfit:'#ec4899'}, online:true,  minutes:2010 },
    { id:'b_kwame',  name:'Kwame',   city:'Accra',     flag:'🇬🇭', char:{skin:'#8d5524',hair:'#1a1a1a',outfit:'#14b8a6'}, online:false, minutes:560 },
    { id:'b_mia',    name:'Mia',     city:'Sydney',    flag:'🇦🇺', char:{skin:'#ffdbac',hair:'#e8c170',outfit:'#8b5cf6'}, online:true,  minutes:1530 },
    { id:'b_arjun',  name:'Arjun',   city:'Mumbai',    flag:'🇮🇳', char:{skin:'#c68642',hair:'#1a1a1a',outfit:'#eab308'}, online:false, minutes:430 },
    { id:'b_elena',  name:'Elena',   city:'Berlin',    flag:'🇩🇪', char:{skin:'#ffdbac',hair:'#6b4423',outfit:'#06b6d4'}, online:true,  minutes:990 },
    { id:'b_diego',  name:'Diego',   city:'Mexico City',flag:'🇲🇽',char:{skin:'#c68642',hair:'#1a1a1a',outfit:'#ef4444'}, online:false, minutes:720 },
  ];

  const CHAT_LINES = [
    'Anyone else grinding finals week? 😩',
    'Just landed in Tokyo after a 90-min session ✈️',
    'Coffee + lofi = unstoppable ☕',
    'Need a study buddy for the next hour, who is in?',
    'Just hit a 7 day streak 🔥',
    'The beach background is so relaxing 🏖️',
    'Pomodoro mode is a game changer',
    'gm everyone, lets get this study session going 📚',
    'Trying to reach 1000 study minutes this month',
    'Whats everyone studying today?',
    'Library silence > everything else',
    'unlocked the spaceship bg, feels amazing 🚀',
    'lets do a group session at the cafe',
    'focus mode on, see you all at the break',
  ];

  const REACTIONS = ['👍','🔥','📚','☕'];
  const STICKERS = ['📖','✏️','🎓','🌍','✈️','⭐','💪','🧠','🏆','🌙'];
  const EMOJIS = ['😀','😅','😴','🤓','🥳','😎','🙌','👀','💯','❤️','😂','🤔','🙏','✨'];

  return { DESTINATIONS, HOME_CITIES, BACKGROUNDS, SHOP, QUESTS, BOTS,
           CHAT_LINES, REACTIONS, STICKERS, EMOJIS };
})();
