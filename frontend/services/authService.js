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
  document.body.style.display='none';
  try {
    const session = await getMe();
    if (session.error) {
      window.location.href = '/frontend/pages/guest/auth/login.html';
    }
    return session;
  } catch (e) {
    window.location.href = '/frontend/pages/guest/auth/login.html';
    return { error: 'Not authenticated' };
  }
}

// redirect to user home if already authenticated (for guest pages)
async function redirectIfAuthenticated() {
  try {
    const session = await getMe();
    if (!session.error) {
      window.location.href = '/frontend/pages/user/home/index.html';
    }
  } catch (e) {
    // not authenticated, stay on page
  }
}

// ── OAUTH: GOOGLE ──
async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  return firebase.auth().signInWithPopup(provider);
}

// ── OAUTH: GITHUB ──
async function loginWithGithub() {
  const provider = new firebase.auth.GithubAuthProvider();
  return firebase.auth().signInWithPopup(provider);
}

// ── OAUTH: SHARED LOGIN ──
// Tries login first; if user not found (404), auto-registers with generated username
async function loginOAuth(idToken) {
  var res = await apiPost('/auth/login', { idToken });
  if (res.error && res.error.includes('not found')) {
    var decoded = JSON.parse(atob(idToken.split('.')[1]));
    var base = decoded.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    var username = base + '_' + Math.floor(1000 + Math.random() * 9000);
    return apiPost('/auth/register', { idToken: idToken, username: username });
  }
  return res;
}
