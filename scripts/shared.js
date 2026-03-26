// ── Shared Utilities ──
(function () {
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ── Markdown Rendering ──
const mdRenderer = new marked.Renderer();
mdRenderer.link = function({ href, title, text }) {
    return `<a href="${href}" target="_blank" rel="noopener noreferrer"${title ? ` title="${title}"` : ''}>${text}</a>`;
};
marked.setOptions({ renderer: mdRenderer, breaks: true });

function renderMarkdown(raw) {
    const html = marked.parse(raw || '');
    return DOMPurify.sanitize(html, {
        ADD_TAGS: ['input'],
        ADD_ATTR: ['type', 'checked', 'disabled']
    });
}

function attachCheckboxHandlers(displayEl, data, moduleEl) {
    const checkboxes = displayEl.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb, index) => {
        cb.removeAttribute('disabled');
        cb.addEventListener('change', () => {
            toggleCheckboxInMarkdown(data, moduleEl, index, cb.checked);
        });
    });
}

// ── Toast Notifications ──
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    setTimeout(() => {
        toast.classList.remove('toast-visible');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 2500);
}

function toggleCheckboxInMarkdown(data, moduleEl, index, checked) {
    const pattern = /- \[([ xX])\]/g;
    let count = 0;
    data.content = data.content.replace(pattern, (match) => {
        if (count++ === index) {
            return checked ? '- [x]' : '- [ ]';
        }
        return match;
    });
    const textarea = moduleEl.querySelector('.module-textarea');
    if (textarea) textarea.value = data.content;
    scheduleSave();
}

window.escapeHtml = escapeHtml;
window.renderMarkdown = renderMarkdown;
window.attachCheckboxHandlers = attachCheckboxHandlers;
window.showToast = showToast;
window.toggleCheckboxInMarkdown = toggleCheckboxInMarkdown;
})();
