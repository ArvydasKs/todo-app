const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/login';
}

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
