// Redirect if already logged in
if (localStorage.getItem('tms_token')) {
    window.location.href = 'dashboard.html';
}

function switchTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('loginTab').classList.toggle('active', isLogin);
    document.getElementById('signupTab').classList.toggle('active', !isLogin);
    document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
    document.getElementById('signupForm').classList.toggle('hidden', isLogin);
}

function setLoading(btnId, textId, loading, defaultText) {
    const btn = document.getElementById(btnId);
    const text = document.getElementById(textId);
    btn.disabled = loading;
    text.textContent = loading ? 'Please wait…' : defaultText;
}

function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.classList.remove('hidden');
}
function hideError(id) {
    document.getElementById(id).classList.add('hidden');
}

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('loginError');
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    setLoading('loginBtn', 'loginBtnText', true, 'Sign In');
    try {
        const data = await api.login({ email, password });
        localStorage.setItem('tms_token', data.token);
        utils.setUser(data.user);
        window.location.href = 'dashboard.html';
    } catch (err) {
        showError('loginError', err.message);
    } finally {
        setLoading('loginBtn', 'loginBtnText', false, 'Sign In');
    }
});

// Signup
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('signupError');
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const role = document.getElementById('signupRole').value;
    if (password.length < 6) {
        showError('signupError', 'Password must be at least 6 characters.');
        return;
    }
    setLoading('signupBtn', 'signupBtnText', true, 'Create Account');
    try {
        const data = await api.signup({ name, email, password, role });
        localStorage.setItem('tms_token', data.token);
        utils.setUser(data.user);
        window.location.href = 'dashboard.html';
    } catch (err) {
        showError('signupError', err.message);
    } finally {
        setLoading('signupBtn', 'signupBtnText', false, 'Create Account');
    }
});
