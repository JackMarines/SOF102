// API utility — thin wrappers around fetch() with session cookie support. Paths are relative to /api/v1.
// Caching: in-memory Map with TTL, invalidate on mutations.

var _apiCache = new Map();
var _CACHE_TTL = 30000; // 30s default

function apiGetCached(path, ttl) {
  ttl = ttl || _CACHE_TTL;
  var key = path;
  if (_apiCache.has(key)) {
    var entry = _apiCache.get(key);
    if (Date.now() - entry.timestamp < ttl) {
      return Promise.resolve(entry.data);
    }
    _apiCache.delete(key);
  }
  return apiGet(path).then(function (data) {
    _apiCache.set(key, { data: data, timestamp: Date.now() });
    return data;
  });
}

function invalidateCache(path) {
  if (path) { _apiCache.delete(path); }
  else { _apiCache.clear(); }
}

async function apiPost(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',          // <-- quan trọng: gửi kèm cookie
    body: JSON.stringify(body),
  });
  return res.json();                 // parse JSON response
}

// Gửi GET request (ví dụ: /me để kiểm tra đăng nhập)
async function apiGet(path) {
  const res = await fetch(API_BASE + path, {
    credentials: 'include',          // <-- quan trọng: gửi kèm cookie
  });
  return res.json();
}

// Gửi PUT request
async function apiPut(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return res.json();
}

// Gửi DELETE request
async function apiDelete(path) {
  const res = await fetch(API_BASE + path, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
}

// Upload file via multipart/form-data (dùng cho avatar, team avatar, v.v.)
async function apiUpload(path, file, extraFields) {
  var formData = new FormData();
  formData.append('file', file);
  if (extraFields) {
    Object.keys(extraFields).forEach(function (key) {
      formData.append(key, extraFields[key]);
    });
  }
  var res = await fetch(API_BASE + path, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return res.json();
}
