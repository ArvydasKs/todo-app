const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/login';
}

async function loadSettings() {
    try {
        const res = await fetch('/auth/settings', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        document.getElementById('notify-upcoming').checked = !!data.notify_upcoming;
        document.getElementById('notify-overdue').checked = !!data.notify_overdue;
    } catch {

    }
}

async function updateSetting(field, value) {
    try {
        const res = await fetch('/auth/settings', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ [field]: value })
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            showMessage('settings-message', data.detail || 'Klaida išsaugant nustatymą.', 'error');
        }
    } catch {
        showMessage('settings-message', 'Serverio klaida. Bandykite dar kartą.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    document.getElementById('notify-upcoming').addEventListener('change', e => {
        updateSetting('notify_upcoming', e.target.checked);
    });
    document.getElementById('notify-overdue').addEventListener('change', e => {
        updateSetting('notify_overdue', e.target.checked);
    });
});

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

async function deleteAccount() {
    if (!confirm('Ar tikrai norite ištrinti paskyrą? Šis veiksmas negrįžtamas.')) return;

    try {
        const res = await fetch('/auth/me', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            showMessage('settings-message', data.detail || 'Klaida trinant paskyrą.', 'error');
            return;
        }

        localStorage.removeItem('token');
        window.location.href = '/login';
    } catch {
        showMessage('settings-message', 'Serverio klaida. Bandykite dar kartą.', 'error');
    }
}
