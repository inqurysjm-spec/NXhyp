/* ============================================================
   STUDYVERSE — real-time backend (Supabase)
   Global/lobby/DM chat, online presence, and friend requests
   shared across all real users worldwide. Falls back silently
   (enabled=false) when Supabase is unreachable so the app keeps
   working offline with simulated peers.
   ============================================================ */
window.SV_NET = (function () {
  let client = null, enabled = false;
  let me = { id: null, name: '', char: {}, city: '' };
  let presenceCh = null, dbCh = null;
  let online = [];                 // [{id,name,char,city}]
  const handlers = { message: [], presence: [], friendRequest: [], friendship: [] };

  function on(ev, cb) { (handlers[ev] || (handlers[ev] = [])).push(cb); }
  function emit(ev, data) { (handlers[ev] || []).forEach(cb => { try { cb(data); } catch (e) {} }); }

  function deviceId() {
    let id = localStorage.getItem('sv_device_id');
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : 'u_' + Math.random().toString(36).slice(2) + Date.now());
      localStorage.setItem('sv_device_id', id);
    }
    return id;
  }

  async function init(profile) {
    const cfg = window.SV_CONFIG;
    if (!cfg || !window.supabase || !window.supabase.createClient) return false;
    try {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
        realtime: { params: { eventsPerSecond: 8 } },
      });
      me.id = deviceId();
      me.name = profile.name; me.char = profile.character || {}; me.city = profile.homeCity || '';

      // upsert profile (best-effort)
      await client.from('sv_profiles').upsert({
        id: me.id, username: me.name, char: me.char, home_city: me.city,
        coins: profile.coins | 0, total_minutes: profile.totalMinutes | 0, miles: profile.miles | 0,
        updated_at: new Date().toISOString(),
      });

      // db changes: chat + friend requests + friendships
      dbCh = client.channel('sv-db')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sv_messages' },
          p => emit('message', p.new))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sv_friend_requests' },
          p => { if (p.new.to_name && p.new.to_name.toLowerCase() === me.name.toLowerCase()) emit('friendRequest', p.new); })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sv_friendships' },
          p => { if (p.new.a_id === me.id || p.new.b_id === me.id) emit('friendship', p.new); });
      await dbCh.subscribe();

      // presence: who is online
      presenceCh = client.channel('sv-presence', { config: { presence: { key: me.id } } });
      presenceCh.on('presence', { event: 'sync' }, () => {
        const state = presenceCh.presenceState();
        const list = [];
        Object.keys(state).forEach(k => { const meta = state[k][0]; if (meta && meta.id && meta.id !== me.id) list.push(meta); });
        online = list; emit('presence', online);
      });
      await presenceCh.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceCh.track({ id: me.id, name: me.name, char: me.char, city: me.city, at: Date.now() });
        }
      });

      enabled = true;
      return true;
    } catch (e) { enabled = false; return false; }
  }

  function isEnabled() { return enabled; }
  function getOnline() { return online; }
  function myId() { return me.id; }
  function dmRoom(otherId) { return 'dm_' + [me.id, otherId].sort().join('__'); }

  async function loadHistory(room, limit) {
    if (!enabled) return [];
    try {
      const { data } = await client.from('sv_messages').select('*')
        .eq('room', room).order('created_at', { ascending: false }).limit(limit || 40);
      return (data || []).reverse();
    } catch (e) { return []; }
  }

  async function send(room, text) {
    if (!enabled) return;
    try {
      await client.from('sv_messages').insert({
        room, user_id: me.id, username: me.name, char: me.char, text: text.slice(0, 280),
      });
    } catch (e) {}
  }

  async function sendFriendRequest(toName) {
    if (!enabled) return false;
    try { await client.from('sv_friend_requests').insert({ from_id: me.id, from_name: me.name, to_name: toName }); return true; }
    catch (e) { return false; }
  }
  async function acceptFriendRequest(req) {
    if (!enabled) return;
    try {
      await client.from('sv_friend_requests').update({ status: 'accepted' }).eq('id', req.id);
      await client.from('sv_friendships').insert({ a_id: me.id, a_name: me.name, b_id: req.from_id, b_name: req.from_name });
    } catch (e) {}
  }
  async function loadFriends() {
    if (!enabled) return [];
    try {
      const { data } = await client.from('sv_friendships').select('*').or(`a_id.eq.${me.id},b_id.eq.${me.id}`);
      return (data || []).map(f => f.a_id === me.id ? { id: f.b_id, name: f.b_name } : { id: f.a_id, name: f.a_name });
    } catch (e) { return []; }
  }
  async function pendingRequests() {
    if (!enabled) return [];
    try {
      const { data } = await client.from('sv_friend_requests').select('*')
        .eq('to_name', me.name).eq('status', 'pending').order('created_at', { ascending: false });
      return data || [];
    } catch (e) { return []; }
  }
  async function updateProfile(p) {
    if (!enabled) return;
    try {
      await client.from('sv_profiles').upsert({
        id: me.id, username: p.name, char: p.character || {}, home_city: p.homeCity || '',
        coins: p.coins | 0, total_minutes: p.totalMinutes | 0, miles: p.miles | 0, updated_at: new Date().toISOString(),
      });
      if (presenceCh) { me.name = p.name; me.char = p.character || {}; me.city = p.homeCity || ''; presenceCh.track({ id: me.id, name: me.name, char: me.char, city: me.city, at: Date.now() }); }
    } catch (e) {}
  }

  return { init, on, isEnabled, getOnline, myId, dmRoom, loadHistory, send,
           sendFriendRequest, acceptFriendRequest, loadFriends, pendingRequests, updateProfile };
})();
