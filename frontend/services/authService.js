// Khởi tạo Firebase
firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();

// ── ĐĂNG NHẬP ──
// 1. Gọi Firebase signInWithEmailAndPassword → lấy idToken
// 2. Gửi idToken lên backend → backend verify + tạo session
async function login(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  const idToken = await cred.user.getIdToken();   // Firebase trả về token
  return apiPost('/auth/login', { idToken });     // Gửi token lên backend
}

// ── ĐĂNG KÝ ──
// 1. Firebase tạo tài khoản mới → lấy idToken
// 2. Gửi idToken + username lên backend → backend lưu vào MySQL
async function register(email, password, username) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  const idToken = await cred.user.getIdToken();
  return apiPost('/auth/register', { idToken, username });
}

// ── ĐĂNG XUẤT ──
// 1. Firebase signOut (xóa token local)
// 2. Gọi backend để hủy session
async function logout() {
  await auth.signOut();
  return apiPost('/auth/logout', {});
}

// ── KIỂM TRA ĐĂNG NHẬP ──
// Gọi /me để xem backend còn session không
// Nếu còn → trả về thông tin user
// Nếu hết → trả về { error: "Not authenticated" }
async function getMe() {
  return apiGet('/auth/me');
}

// redirect to login if not authenticated
async function checkAuth() {
  const session = await getMe();
  if (session.error) {
    window.location.href = '/frontend/pages/auth/login.html';
  }
  return session;
}
