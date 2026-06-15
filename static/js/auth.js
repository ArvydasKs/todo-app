let token = localStorage.getItem('token') || null;

if (token) {
    window.location.href = '/';
}

function showTab(tab, event) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
}

async function register() {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!username || !email || !password) {
        showMessage('auth-message', 'Užpildykite visus laukus', 'error');
        return;
    }

    const emailParts = email.split('@');
    if (emailParts.length !== 2 || !emailParts[1].includes('.')) {
        showMessage('auth-message', 'Netinkamas el. pašto formatas', 'error');
        return;
    }

    const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    if (res.ok) {
        showMessage('auth-message', 'Registracija sėkminga! Prisijunkite.', 'success');
        document.getElementById('reg-username').value = '';
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-password').value = '';
        showTab('login', { target: document.querySelector('.tabs .tab') });
    } else {
        const data = await res.json().catch(() => ({}));
        showMessage('auth-message', data.detail || 'Klaida', 'error');
    }
}

async function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showMessage('auth-message', 'Užpildykite visus laukus', 'error');
        return;
    }

    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    });

    if (res.ok) {
        const data = await res.json();
        token = data.access_token;
        localStorage.setItem('token', token);
        window.location.href = '/';
    } else {
        showMessage('auth-message', 'Neteisingi prisijungimo duomenys', 'error');
    }
}
