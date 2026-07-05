function friendlyAuthError(err) {
    var text = (err.message || err.code || JSON.stringify(err)).toUpperCase();
    if (text.includes('INVALID_LOGIN_CREDENTIALS') || text.includes('WRONG_PASSWORD') || text.includes('USER_NOT_FOUND') || text.includes('INVALID_EMAIL')) {
        return 'Wrong email or password';
    }
    if (text.includes('EMAIL_ALREADY_EXISTS') || text.includes('EMAIL_ALREADY_IN_USE')) {
        return 'Email already registered';
    }
    if (text.includes('WEAK_PASSWORD')) {
        return 'Password is too weak';
    }
    return err.message || 'An error occurred';
}

var loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    var errorDiv = document.getElementById('loginError');
    errorDiv.textContent = '';

    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;

    try {
      var result = await login(email, password);

      if (result.error) {
        errorDiv.textContent = result.error;
        return;
      }

      window.location.href = '/frontend/pages/user/puzzle/index.html';
    } catch (err) {
      errorDiv.textContent = friendlyAuthError(err);
    }
  });
}

var registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    var errorDiv = document.getElementById('registerError');
    errorDiv.textContent = '';

    var username = document.getElementById('regUsername').value;
    var email = document.getElementById('regEmail').value;
    var password = document.getElementById('regPassword').value;
    var confirm = document.getElementById('regConfirm').value;

    if (password !== confirm) {
      errorDiv.textContent = 'Passwords do not match';
      return;
    }

    try {
      var result = await register(email, password, username);

      if (result.error) {
        errorDiv.textContent = result.error;
        return;
      }

      window.location.href = '/frontend/pages/user/puzzle/index.html';
    } catch (err) {
      errorDiv.textContent = friendlyAuthError(err);
    }
  });
}
