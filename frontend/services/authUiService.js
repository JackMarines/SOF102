// ===========================
// AUTH UI
// ===========================

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

function initLoginForm() {
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        var errorDiv = document.getElementById('loginError');
        errorDiv.textContent = '';

        var email = document.getElementById('email').value;
        var password = document.getElementById('password').value;

        try {
          showSpinner("loginForm");
          var result = await login(email, password);
          hideSpinner("loginForm");

          if (result.error) {
            errorDiv.textContent = result.error;
            return;
          }

          window.location.href = '/user-puzzle';
        } catch (err) {
          hideSpinner("loginForm");
          errorDiv.textContent = friendlyAuthError(err);
        }
      });
    }
}

function initRegisterForm() {
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
          showSpinner("registerForm");
          var result = await register(email, password, username);
          hideSpinner("registerForm");

          if (result.error) {
            errorDiv.textContent = result.error;
            return;
          }

          window.location.href = '/user-puzzle';
        } catch (err) {
          hideSpinner("registerForm");
          errorDiv.textContent = friendlyAuthError(err);
        }
      });
    }
}
