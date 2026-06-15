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

function parseLocalDateTime(s) {
    if (!s) return null;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!m) return null;
    const [, y, mo, d, hh, mm, ss] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mm), Number(ss || 0));
}

function formatDueDate(s) {
    const dt = parseLocalDateTime(s);
    if (!dt) return '';
    return `${dt.getFullYear()}/${pad(dt.getMonth() + 1)}/${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
