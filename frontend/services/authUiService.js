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
        var btn = loginForm.querySelector('button[type="submit"]');
        if (btn && btn.disabled) return;
        if (btn) btn.disabled = true;

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

          window.location.href = '/frontend/pages/user/home/index.html';
        } catch (err) {
          hideSpinner("loginForm");
          errorDiv.textContent = friendlyAuthError(err);
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    }
}

function initRegisterForm() {
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        var btn = registerForm.querySelector('button[type="submit"]');
        if (btn && btn.disabled) return;
        if (btn) btn.disabled = true;

        var errorDiv = document.getElementById('registerError');
        errorDiv.textContent = '';

        var username = document.getElementById('regUsername').value;
        var email = document.getElementById('regEmail').value;
        var password = document.getElementById('regPassword').value;
        var confirm = document.getElementById('regConfirm').value;

        if (password !== confirm) {
          errorDiv.textContent = 'Passwords do not match';
          if (btn) btn.disabled = false;
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

          window.location.href = '/frontend/pages/user/home/index.html';
        } catch (err) {
          hideSpinner("registerForm");
          errorDiv.textContent = friendlyAuthError(err);
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    }
}

// ── OAUTH BUTTONS ──
function initOAuthButtons() {
    var googleBtn = document.getElementById('googleBtn');
    var githubBtn = document.getElementById('githubBtn');
    var errorDiv = document.getElementById('loginError') || document.getElementById('registerError');

    function handleError(err) {
        if (errorDiv) errorDiv.textContent = friendlyAuthError(err);
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', async function () {
            try {
                var result = await loginWithGoogle();
                var idToken = await result.user.getIdToken();
                var res = await loginOAuth(idToken);
                if (res.error) { handleError(res); return; }
                window.location.href = '/frontend/pages/user/home/index.html';
            } catch (err) {
                handleError(err);
            }
        });
    }

    if (githubBtn) {
        githubBtn.addEventListener('click', async function () {
            try {
                var result = await loginWithGithub();
                var idToken = await result.user.getIdToken();
                var res = await loginOAuth(idToken);
                if (res.error) { handleError(res); return; }
                window.location.href = '/frontend/pages/user/home/index.html';
            } catch (err) {
                handleError(err);
            }
        });
    }
}
