let token = localStorage.getItem('token') || null;
if (!token) window.location.href = '/login';

function logout() {
    token = null;
    localStorage.removeItem('token');
    window.location.href = '/login';
}

const _now = new Date();
let currentYear = _now.getFullYear();
let currentMonth = _now.getMonth();

let tasksCache = [];
let categoriesCache = [];

const MONTH_NAMES = [
    'Sausis', 'Vasaris', 'Kova', 'Balandis', 'Gegužė', 'Birželis',
    'Liepa', 'Rugpjūtis', 'Rugsėjis', 'Spalis', 'Lapkritis', 'Gruodis'
];
const DAY_HEADERS = ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'];

async function loadData() {
    const [tasksRes, catsRes] = await Promise.all([
        fetch(`${API}/tasks/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/categories/`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    if (!tasksRes.ok) { logout(); return; }
    tasksCache = await tasksRes.json();
    categoriesCache = catsRes.ok ? await catsRes.json() : [];
    renderCalendar();
}

function renderCalendar() {
    document.getElementById('calendar-title').textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    DAY_HEADERS.forEach(d => {
        const el = document.createElement('div');
        el.className = 'calendar-day-header';
        el.textContent = d;
        grid.appendChild(el);
    });

    const firstWeekday = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = firstWeekday === 0 ? 6 : firstWeekday - 1;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    const today = new Date();

    const tasksByDate = {};
    tasksCache.forEach(task => {
        if (!task.due_date) return;
        const dateKey = task.due_date.substring(0, 10);
        if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
        tasksByDate[dateKey].push(task);
    });

    for (let i = 0; i < startOffset; i++) {
        grid.appendChild(makeCell(daysInPrevMonth - startOffset + 1 + i, null, 'other-month', null));
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === d;
        grid.appendChild(makeCell(d, dateKey, isToday ? 'today' : '', tasksByDate[dateKey] || []));
    }

    const totalCells = startOffset + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
        grid.appendChild(makeCell(i, null, 'other-month', null));
    }
}

function makeCell(dayNum, dateKey, extraClass, tasks) {
    const cell = document.createElement('div');
    cell.className = `calendar-day${extraClass ? ' ' + extraClass : ''}`;

    const label = document.createElement('span');
    label.className = 'day-number';
    label.textContent = dayNum;
    cell.appendChild(label);

    if (tasks && tasks.length > 0) {
        tasks.forEach(task => {
            const chip = document.createElement('div');
            chip.className = `task-chip priority-${task.priority}`;
            chip.textContent = task.title;
            chip.title = task.title;
            chip.onclick = () => openModal(task);
            cell.appendChild(chip);
        });
    }

    return cell;
}

function openModal(task) {
    const category = categoriesCache.find(c => c.id === task.category_id);
    const priorityLabels = { low: 'Žemas', medium: 'Vidutinis', high: 'Aukštas' };

    document.getElementById('modal-title').textContent = task.title;
    document.getElementById('modal-body').innerHTML = `
        ${task.description ? `<p><strong>Aprašymas:</strong> ${task.description}</p>` : ''}
        <p><strong>Prioritetas:</strong> <span class="priority-text-${task.priority}">${priorityLabels[task.priority]}</span></p>
        ${category ? `<p><strong>Kategorija:</strong> ${category.name}</p>` : ''}
        ${task.due_date ? `<p><strong>Terminas:</strong> ${formatDueDate(task.due_date)}</p>` : ''}
        ${task.completed ? `<p><strong>Statusas:</strong> Įvykdyta ✓</p>` : ''}
    `;
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
}

document.addEventListener('DOMContentLoaded', loadData);
