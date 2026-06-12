let token = localStorage.getItem('token') || null;

if (!token) {
    window.location.href = '/static/login.html';
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    window.location.href = '/static/login.html';
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
    } else {
        logout();
    }
}

function applyFilter(criteria) {
    if (!tasksCache) tasksCache = [];
    let arr = tasksCache.slice();
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

    list.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : task.priority}">
            <div class="task-info">
                <h3 style="${task.completed ? 'text-decoration:line-through' : ''}">${task.title}</h3>
                ${task.description ? `<small>${task.description}</small><br>` : ''}
                <small>Prioritetas: ${task.priority}</small>
                    ${task.due_date ? `<br><small>Įvykdyti iki: ${formatDueDate(task.due_date)}</small>` : ''}
            </div>
            <div>
                ${!task.completed ? `<button class="secondary" onclick="completeTask(${task.id})">✓</button>` : ''}
                <button class="danger" onclick="deleteTask(${task.id})">✕</button>
            </div>
        </div>
    `).join('');
}

async function createTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const due_date = document.getElementById('task-due').value;
    const priority = document.getElementById('task-priority').value;

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
        body: JSON.stringify({ title, description, priority, due_date: due_date || null })
    });

    if (res.ok) {
        document.getElementById('task-title').value = '';
        document.getElementById('task-desc').value = '';
        document.getElementById('task-due').value = '';
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
});
