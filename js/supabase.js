var SUPABASE_URL = 'https://bkqyryolitaunuociuvx.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrcXlyeW9saXRhdW51b2NpdXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NDEwMTUsImV4cCI6MjA5NTUxNzAxNX0.AP_OmGKWnHVEbFYMkK5xKitQQWLVKQGrOU7wDA7UdN8';

async function sb(method, path, body, opts) {
  opts = opts || {};
  var headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
  };
  if (method === 'POST' || method === 'PUT') {
    headers['Prefer'] = 'return=representation';
  }
  if (opts.single) {
    headers['Accept'] = 'application/vnd.pgrst.object+json';
  }
  if (opts.count) {
    headers['Prefer'] = (headers['Prefer'] ? headers['Prefer'] + ',' : '') + 'count=exact';
  }
  var fetchOpts = { method: method, headers: headers };
  if (body) fetchOpts.body = JSON.stringify(body);
  var url = SUPABASE_URL + '/rest/v1/' + path;
  var res = await fetch(url, fetchOpts);
  if (res.status === 204) return null;
  var text = await res.text();
  if (!res.ok) {
    var errMsg = text;
    try { errMsg = JSON.parse(text).message || text; } catch(e) {}
    throw new Error(errMsg);
  }
  if (!text) return null;
  return JSON.parse(text);
}

async function hashPw(pw) {
  var data = new TextEncoder().encode(pw + 'nxhyp_salt_2024');
  var buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
