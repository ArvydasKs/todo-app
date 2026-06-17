let token = localStorage.getItem('token') || null;

if (!token) {
    window.location.href = '/login';
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    window.location.href = '/login';
}

let tasksCache = [];

function showTasksSection() {
    const authEl = document.getElementById('auth-section');
    if (authEl) authEl.style.display = 'none';
    document.getElementById('tasks-section').style.display = 'block';
    loadTasks();
}

async function loadTasks() {
    const res = await fetch(`${API}/tasks/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
        tasksCache = await res.json();
        applyFilter(document.getElementById('tasks-filter')?.value || 'created');
        const filterEl = document.getElementById('tasks-filter');
        if (filterEl && !filterEl._listenerAttached) {
            filterEl.addEventListener('change', () => applyFilter(filterEl.value));
            filterEl._listenerAttached = true;
        }
        const categoryFilterEl = document.getElementById('filter-category');
        if (categoryFilterEl && !categoryFilterEl._listenerAttached) {
            categoryFilterEl.addEventListener('change', () => applyFilter(document.getElementById('tasks-filter')?.value || 'created'));
            categoryFilterEl._listenerAttached = true;
        }
        ['low', 'medium', 'high'].forEach(p => {
            const el = document.getElementById(`filter-${p}`);
            if (el && !el._listenerAttached) {
                el.addEventListener('change', () => applyFilter(document.getElementById('tasks-filter')?.value || 'created'));
                el._listenerAttached = true;
            }
        });
    } else {
        logout();
    }
}

function applyFilter(criteria) {
    if (!tasksCache) tasksCache = [];
    const activeFilters = ['low', 'medium', 'high'].filter(p => {
        const el = document.getElementById(`filter-${p}`);
        return el ? el.checked : true;
    });
    const categoryFilter = document.getElementById('filter-category')?.value || '';
    let arr = tasksCache.filter(t => {
        const priorityMatch = activeFilters.includes(t.priority);
        const categoryMatch = !categoryFilter || String(t.category_id) === categoryFilter;
        return priorityMatch && categoryMatch;
    });
    if (criteria === 'due') {
        arr.sort((a, b) => {
            if (!a.due_date && !b.due_date) return 0;
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date) - new Date(b.due_date);
        });
    } else if (criteria === 'priority') {
        const order = { high: 1, medium: 2, low: 3 };
        arr.sort((a, b) => (order[a.priority] || 4) - (order[b.priority] || 4));
    } else {
        arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    renderTasks(arr);
}

function renderTasks(tasks) {
    const list = document.getElementById('tasks-list');
    if (!list) return;
    if (tasks.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#666; margin:20px;">Užduočių nėra. Pridėkite pirmą!</p>';
        return;
    }

    const now = new Date();
    list.innerHTML = tasks.map(task => {
        const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < now;
        return `
        <div class="task-item ${task.completed ? 'completed' : task.priority}${isOverdue ? ' overdue' : ''}">
            <div class="task-info">
                <h3 style="${task.completed ? 'text-decoration:line-through' : ''}">${task.title}</h3>
                ${task.description ? `<small>${task.description}</small><br>` : ''}
                <small>Prioritetas: ${{ low: 'žemas', medium: 'vidutinis', high: 'aukštas' }[task.priority]}</small>
                ${task.category ? `<br><small>Kategorija: ${task.category.name}</small>` : ''}
                ${task.due_date ? `<br><small class="${isOverdue ? 'overdue-text' : ''}">Įvykdyti iki: ${formatDueDate(task.due_date)}${isOverdue ? ' ⚠ Vėluojama!' : ''}</small>` : ''}
            </div>
            <div>
                ${!task.completed ? `<button class="secondary" onclick="completeTask(${task.id})">✓</button>` : ''}
                <button class="danger" onclick="deleteTask(${task.id})">✕</button>
            </div>
        </div>`;
    }).join('');
}

async function loadCategoriesForDropdown() {
    const res = await fetch(`${API}/categories/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const categories = await res.json();

    const createSelect = document.getElementById('task-category');
    if (createSelect) {
        createSelect.innerHTML = '<option value="">-- Kategorija (neprivaloma) --</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            createSelect.appendChild(opt);
        });
    }

    const filterSelect = document.getElementById('filter-category');
    if (filterSelect) {
        const current = filterSelect.value;
        filterSelect.innerHTML = '<option value="">Visos</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            filterSelect.appendChild(opt);
        });
        filterSelect.value = current;
    }
}

async function createTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const due_date = document.getElementById('task-due').value;
    const priority = document.getElementById('task-priority').value;
    const categoryVal = document.getElementById('task-category').value;
    const category_id = categoryVal ? parseInt(categoryVal) : null;

    if (!title) {
        showMessage('tasks-message', 'Įveskite užduoties pavadinimą', 'error');
        return;
    }

    const res = await fetch(`${API}/tasks/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, priority, due_date: due_date || null, category_id })
    });

    if (res.ok) {
        document.getElementById('task-title').value = '';
        document.getElementById('task-desc').value = '';
        document.getElementById('task-due').value = '';
        document.getElementById('task-category').value = '';
        loadTasks();
    } else {
        showMessage('tasks-message', 'Klaida kuriant užduotį', 'error');
    }
}

async function completeTask(id) {
    await fetch(`${API}/tasks/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    loadTasks();
}

async function deleteTask(id) {
    await fetch(`${API}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    loadTasks();
}

document.addEventListener('DOMContentLoaded', () => {
    showTasksSection();
    loadCategoriesForDropdown();
});
