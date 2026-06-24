const API = '';

function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => el.innerHTML = '', 3000);
}

function pad(num) {
    return String(num).padStart(2, '0');
}

function formatDueDate(s) {
    if (!s) return '';
    const dt = new Date(s);
    if (isNaN(dt)) return '';
    return `${dt.getFullYear()}/${pad(dt.getMonth() + 1)}/${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
