// Forgot password orchestrator — handles the password reset form submission
(function () {
    var form = document.getElementById('forgotForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var errorDiv = document.getElementById('forgotError');
        errorDiv.textContent = '';

        var email = document.getElementById('resetEmail').value.trim();

        if (!email) {
            errorDiv.textContent = 'Please enter your email';
            return;
        }

        try {
            showSpinner('forgotForm');
            await resetPassword(email);
            hideSpinner('forgotForm');

            // Show success — always same message regardless of email existence
            document.getElementById('forgotCard').classList.add('d-none');
            var successEl = document.getElementById('forgotSuccess');
            successEl.classList.remove('d-none');
            document.getElementById('successEmail').textContent =
                'We sent a password reset link to ' + email;
        } catch (err) {
            hideSpinner('forgotForm');
            // Still show success (security: never reveal if email exists)
            document.getElementById('forgotCard').classList.add('d-none');
            document.getElementById('forgotSuccess').classList.remove('d-none');
            document.getElementById('successEmail').textContent =
                'We sent a password reset link to ' + email;
        }
    });
})();
