// Khi user bấm nút Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const result = await login(email, password);

      if (result.error) {
        alert('Lỗi: ' + result.error);
        return;
      }

      console.log('Đăng nhập thành công:', result);
      window.location.href = '/';
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  });
}

// Khi user submit form Register
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;

    if (password !== confirm) {
      alert('Mật khẩu nhập lại không khớp');
      return;
    }

    try {
      const result = await register(email, password, username);

      if (result.error) {
        alert('Lỗi: ' + result.error);
        return;
      }

      console.log('Đăng ký thành công:', result);
      window.location.href = '/';
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  });
}