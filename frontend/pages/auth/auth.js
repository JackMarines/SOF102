// Khi user bấm nút Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();  // Ngăn form reload trang

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    // Gọi Firebase + backend
    const result = await login(email, password);

    // Nếu backend trả lỗi
    if (result.error) {
      alert('Lỗi: ' + result.error);
      return;
    }

    // Thành công → chuyển về trang chủ
    console.log('Đăng nhập thành công:', result);
    window.location.href = '/';  // Chuyển về landing page
  } catch (err) {
    // Lỗi từ Firebase (sai mật khẩu, email không tồn tại...)
    alert('Lỗi: ' + err.message);
  }
});

// Khi user bấm nút Register
document.querySelector('.register-btn').addEventListener('click', async (e) => {
  e.preventDefault();

  // Lấy giá trị từ form
  const username = document.querySelector('input[placeholder="Enter username"]').value;
  const email = document.querySelector('input[placeholder="Enter email"]').value;
  const password = document.querySelector('input[placeholder="Enter password"]').value;
  const confirm = document.querySelector('input[placeholder="Confirm password"]').value;

  // Kiểm tra mật khẩu nhập lại có khớp không
  if (password !== confirm) {
    alert('Mật khẩu nhập lại không khớp');
    return;
  }

  try {
    // Gọi Firebase tạo tài khoản + backend lưu user
    const result = await register(email, password, username);

    if (result.error) {
      alert('Lỗi: ' + result.error);
      return;
    }

    console.log('Đăng ký thành công:', result);
    window.location.href = '/';  // Về trang chủ
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
});
