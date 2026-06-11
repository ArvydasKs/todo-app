let token = localStorage.getItem('token') || null;
const API = '';

if (token) showTasksSection();

function showTab(tab, event) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
}

function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => el.innerHTML = '', 3000);
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
        const data = await res.json();
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
        body: `username=${username}&password=${password}`
    });

    if (res.ok) {
        const data = await res.json();
        token = data.access_token;
        localStorage.setItem('token', token);
        showTasksSection();
    } else {
        showMessage('auth-message', 'Neteisingi prisijungimo duomenys', 'error');
    }
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('tasks-section').style.display = 'none';
}

function showTasksSection() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('tasks-section').style.display = 'block';
    loadTasks();
}

async function loadTasks() {
    const res = await fetch(`${API}/tasks/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
        const tasks = await res.json();
        renderTasks(tasks);
    } else {
        logout();
    }
}

function renderTasks(tasks) {
    const list = document.getElementById('tasks-list');
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
        body: JSON.stringify({ title, description, priority })
    });

    if (res.ok) {
        document.getElementById('task-title').value = '';
        document.getElementById('task-desc').value = '';
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