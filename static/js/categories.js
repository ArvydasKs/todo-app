let token = localStorage.getItem('token') || null;

if (!token) {
    window.location.href = '/login';
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    window.location.href = '/login';
}

async function loadCategories() {
    const res = await fetch(`${API}/categories/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
        const categories = await res.json();
        renderCategories(categories);
    } else {
        logout();
    }
}

function renderCategories(categories) {
    const list = document.getElementById('categories-list');
    if (!list) return;

    if (categories.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#666; margin:20px;">Kategorijų nėra. Pridėkite pirmą!</p>';
        return;
    }

    list.innerHTML = categories.map(cat => `
        <div class="task-item">
            <div class="task-info">
                <h3>${cat.name}</h3>
            </div>
            <div>
                <button class="danger" onclick="deleteCategory(${cat.id})">✕</button>
            </div>
        </div>
    `).join('');
}

async function createCategory() {
    const name = document.getElementById('category-name').value.trim();

    if (!name) {
        showMessage('categories-message', 'Įveskite kategorijos pavadinimą', 'error');
        return;
    }

    const res = await fetch(`${API}/categories/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
    });

    if (res.ok) {
        document.getElementById('category-name').value = '';
        loadCategories();
    } else {
        showMessage('categories-message', 'Klaida kuriant kategoriją', 'error');
    }
}

async function deleteCategory(id) {
    const res = await fetch(`${API}/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
        loadCategories();
    } else {
        showMessage('categories-message', 'Klaida trinant kategoriją', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
});
