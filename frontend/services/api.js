// API utility — thin wrappers around fetch() with session cookie support. Paths are relative to /api/v1.
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
