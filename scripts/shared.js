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
    const textarea = moduleEl.querySelector('.module-textarea') || moduleEl.querySelector('.save-notes-textarea');
    if (textarea) textarea.value = data.content;
    scheduleSave();
}

// ── Shared Icon Library ──
// Unified SVG icons used across all modules. Each module defines its own picker
// arrays referencing keys from this object. All SVGs use viewBox="0 0 24 24";
// display size is controlled by the .icon CSS class.
var CV_ICONS = {
    // ── Generic ──
    star:              '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    circle:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>',
    square:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>',
    triangle:          '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 22 2 22"/></svg>',
    diamond:           '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 12 12 22 2 12"/></svg>',
    hash:              '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
    crosshair:         '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>',

    // ── Time ──
    hourglass:         '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v4l-5 5 5 5v4H6v-4l5-5-5-5V2z"/><line x1="6" y1="2" x2="18" y2="2"/><line x1="6" y1="22" x2="18" y2="22"/></svg>',
    clock:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    stopwatch:         '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="8"/><line x1="12" y1="14" x2="12" y2="10"/><line x1="10" y1="2" x2="14" y2="2"/><line x1="18.5" y1="7.5" x2="20" y2="6"/></svg>',
    bell:              '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    timer:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="9"/><polyline points="12 9 12 13 15 16"/><line x1="12" y1="1" x2="12" y2="4"/></svg>',

    // ── Combat ──
    sword:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="2" x2="7" y2="18"/><line x1="21" y1="6" x2="12" y2="6"/><path d="M5 20l2-2"/><path d="M3 22l2-2"/></svg>',
    shield:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 7v6c0 5.25 3.75 9.5 9 11 5.25-1.5 9-5.75 9-11V7l-9-5z"/></svg>',
    armour:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 7v6c0 5.25 3.75 9.5 9 11 5.25-1.5 9-5.75 9-11V7l-9-5z"/></svg>',
    flame:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4-2-7-6-7-11 0-3 2-6 4-7 0 3 2 5 3 5 0-4 2-8 5-9 0 4 1 7 1 10 2 0 3-2 3-4 2 2 3 5 3 6 0 5-3 9-7 11-1 .5-3 .5-5-1z"/></svg>',
    bolt:              '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    target:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    dagger:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="17"/><line x1="8" y1="8" x2="16" y2="8"/><path d="M10 17 Q12 21 14 17"/></svg>',
    bow:               '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4 Q1 12 5 20"/><line x1="5" y1="4" x2="5" y2="20"/><line x1="5" y1="12" x2="20" y2="12"/><polyline points="16 9 20 12 16 15"/></svg>',
    axe:               '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="18" x2="15" y2="9"/><path d="M15 9 Q15 3 21 3 Q21 9 15 9"/></svg>',
    wand:              '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="20" x2="16" y2="8"/><polyline points="16 8 19 5 21 7 18 10 16 8"/><line x1="20" y1="3" x2="22" y2="5"/><line x1="18" y1="2" x2="18" y2="4"/><line x1="22" y1="6" x2="20" y2="6"/></svg>',
    staff:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M9 6Q12 3 15 6"/><circle cx="12" cy="10" r="2"/><path d="M9 18Q12 21 15 18"/></svg>',
    gun:               '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h10v4l4 1v2h-5v-2H4v-5z"/><line x1="14" y1="10" x2="17" y2="8"/><rect x="5" y="14" width="2" height="4" rx="1"/></svg>',

    // ── Resources ──
    coin:              '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M9 9h3.5a2 2 0 010 4H9m0 0h4a2 2 0 010 4H9"/></svg>',
    gem:               '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14l3 5-10 13L2 9l3-5z"/><line x1="2" y1="9" x2="22" y2="9"/></svg>',
    potion:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6v3l4 7A6 6 0 015 13l4-7V3z"/><line x1="8" y1="9" x2="16" y2="9"/></svg>',
    apple:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1-1 3-1.5 4 0"/><path d="M17 6c2 2 3 5 2.5 9s-2.5 6-5.5 7c-1 .3-1.7.3-2 0-3-1-5-3-5.5-7S7 8 9 6c1-1 3-1 4 0s2-.5 4 0z"/></svg>',
    water:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 8 5 12 5 16a7 7 0 0014 0c0-4-3-8-7-14z"/></svg>',
    key:               '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="9" r="5"/><line x1="13" y1="9" x2="21" y2="9"/><line x1="17" y1="9" x2="17" y2="12"/><line x1="20" y1="9" x2="20" y2="11"/></svg>',
    bread:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16c0-5 2-9 8-9s8 4 8 9l-1 2H5l-1-2z"/><line x1="8" y1="12" x2="8" y2="17"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="16" y1="12" x2="16" y2="17"/></svg>',
    bottle:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3h4v3l1.5 2.5V20a1 1 0 01-1 1H9.5a1 1 0 01-1-1V8.5L10 6V3z"/><line x1="9.5" y1="13" x2="14.5" y2="13"/></svg>',

    // ── Miscellaneous ──
    scroll:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h12a2 2 0 002-2V5a2 2 0 00-2-2H8l-4 4v12a2 2 0 002 2z"/><path d="M4 7h4v-4"/><line x1="10" y1="11" x2="16" y2="11"/><line x1="10" y1="15" x2="14" y2="15"/></svg>',
    skull:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="8"/><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none"/><path d="M9 18v4"/><path d="M15 18v4"/><path d="M12 18v4"/></svg>',
    'skull-crossbones':'<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="7"/><circle cx="9.5" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="14.5" cy="8" r="1.5" fill="currentColor" stroke="none"/><path d="M8 16l8 6"/><path d="M16 16l-8 6"/></svg>',
    eye:               '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    hand:              '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17V8a1.5 1.5 0 013 0v5"/><path d="M12 11V7a1.5 1.5 0 013 0v4"/><path d="M15 11V8.5a1.5 1.5 0 013 0V17a5 5 0 01-10 0v-2.5a1.5 1.5 0 013 0"/><path d="M6 13V9a1.5 1.5 0 013 0"/></svg>',
    magnify:           '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg>',
    scale:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><polyline points="4 7 12 3 20 7"/><line x1="4" y1="7" x2="4" y2="13"/><line x1="20" y1="7" x2="20" y2="13"/><path d="M4 13a4 4 0 0 0 8 0"/><path d="M12 13a4 4 0 0 0 8 0"/></svg>',
    power:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
    torch:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="14" width="4" height="7" rx="1"/><path d="M12 14c-3-4-1-9 0-11 1 2 3 7 0 11z"/></svg>',
    flash:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="6" height="10" rx="1"/><path d="M8 9L6 5h12l-2 4"/><circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg>',

    // ── Equipment ──
    helmet:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C7 2 3 6 3 11v3h2v-1a7 7 0 0 1 14 0v1h2v-3c0-5-4-9-9-9z"/><rect x="3" y="14" width="18" height="4" rx="1"/></svg>',
    boots:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v13l-3 4h12v-3l-3-3V3H8z"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
    gloves:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17V8a1.5 1.5 0 013 0v5"/><path d="M12 11V7a1.5 1.5 0 013 0v4"/><path d="M15 11V8.5a1.5 1.5 0 013 0V17a5 5 0 01-10 0v-2.5a1.5 1.5 0 013 0"/></svg>',
    shirt:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 7 4 9.5 7 12 4 14.5 7 17 4 21 8 18 10 18 20 6 20 6 10 3 8"/></svg>',
    pants:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16l-2 10h-4l-2 6-2-6H6L4 4z"/></svg>',
    shoes:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16l1-6h5l2 3h10v3H3z"/><line x1="4" y1="13" x2="6" y2="13"/></svg>',

    // ── Sci-Fi ──
    rocket:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 6 6 10 6 16h12c0-6-2-10-6-14z"/><line x1="9" y1="22" x2="9" y2="16"/><line x1="15" y1="22" x2="15" y2="16"/><circle cx="12" cy="12" r="2"/></svg>',
    laser:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="10" y2="12"/><polygon points="10 8 22 12 10 16 10 8"/><line x1="2" y1="8" x2="6" y2="8"/><line x1="2" y1="16" x2="6" y2="16"/></svg>',
    radiation:         '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 9C11 5 9 2 6 2c0 4 1 6 3 8"/><path d="M15 12c4-1 7-3 7-6-4 0-6 1-8 3"/><path d="M12 15c1 4 3 7 6 7 0-4-1-6-3-8"/><path d="M9 12c-4 1-7 3-7 6 4 0 6-1 8-3"/></svg>',
    circuit:           '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none"/><line x1="8" y1="9.5" x2="8" y2="14.5"/><line x1="16" y1="9.5" x2="16" y2="14.5"/><line x1="9.5" y1="8" x2="14.5" y2="8"/></svg>',
    energy:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/><line x1="7" y1="2" x2="5" y2="6"/><line x1="19" y1="18" x2="17" y2="22"/></svg>',
    robot:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="14" height="12" rx="2"/><line x1="12" y1="4" x2="12" y2="7"/><circle cx="12" cy="3" r="1"/><circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/><line x1="9" y1="16" x2="15" y2="16"/></svg>',
    wrench:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',

    // ── Damage Types (Resistances) ──
    acid:              '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v6l-4 8a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4l-4-8V2"/><line x1="10" y1="2" x2="14" y2="2"/><path d="M8.5 14a1.5 1.5 0 1 0 0 3"/><circle cx="14" cy="16" r="1"/></svg>',
    bludgeoning:       '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="14" x2="4" y2="20"/><path d="M12 12a5 5 0 0 1 5-5h1a2 2 0 0 0 2-2V4a1 1 0 0 0-1-1h-1a2 2 0 0 0-2 2 5 5 0 0 1-5 5"/><circle cx="14" cy="10" r="4"/></svg>',
    cold:              '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/><polyline points="9 2 12 5 15 2"/><polyline points="9 22 12 19 15 22"/><polyline points="2 9 5 12 2 15"/><polyline points="22 9 19 12 22 15"/></svg>',
    fire:              '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 3 5 6 5 11a5 5 0 0 1-10 0c0-5 4-8 5-11z"/><path d="M12 18a2 2 0 0 1-2-2c0-2 2-3 2-3s2 1 2 3a2 2 0 0 1-2 2z"/></svg>',
    force:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>',
    lightning:         '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 2 4 14 12 14 11 22 20 10 12 10 13 2"/></svg>',
    necrotic:          '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="7"/><circle cx="9.5" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="14.5" cy="8" r="1.5" fill="currentColor" stroke="none"/><path d="M8 13h8"/><line x1="10" y1="13" x2="10" y2="16"/><line x1="14" y1="13" x2="14" y2="16"/><path d="M9 22v-6"/><path d="M15 22v-6"/></svg>',
    piercing:          '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><polygon points="12 2 8 10 12 8 16 10 12 2" fill="none"/></svg>',
    poison:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 6 5 9 5 14a7 7 0 0 0 14 0c0-5-3-8-7-12z"/><circle cx="10" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="14" cy="13" r="1" fill="currentColor" stroke="none"/><path d="M9 17c1.5 1 4.5 1 6 0"/></svg>',
    psychic:           '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 3 1.5 5 3 6.5V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3.5c1.5-1.5 3-3.5 3-6.5a8 8 0 0 0-8-8z"/><path d="M8 12c1-1 2-2 4-2s3 1 4 2"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
    radiant:           '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>',
    slashing:          '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="4" x2="19" y2="20"/><line x1="9" y1="4" x2="22" y2="18"/><line x1="2" y1="6" x2="15" y2="20"/></svg>',
    thunder:           '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c2-1 3-3 3-3"/><path d="M5 12c2-2 3-5 3-5"/><path d="M8 12c2-3 3-7 3-7"/><path d="M22 12c-2-1-3-3-3-3"/><path d="M19 12c-2-2-3-5-3-5"/><path d="M16 12c-2-3-3-7-3-7"/><path d="M2 12c2 1 3 3 3 3"/><path d="M5 12c2 2 3 5 3 5"/><path d="M8 12c2 3 3 7 3 7"/><path d="M22 12c-2 1-3 3-3 3"/><path d="M19 12c-2 2-3 5-3 5"/><path d="M16 12c-2 3-3 7-3 7"/></svg>'
};

// ── Shared Sort Indicator SVGs ──
var CV_SVG_SORT_UP   = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
var CV_SVG_SORT_DOWN = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';

window.escapeHtml = escapeHtml;
window.renderMarkdown = renderMarkdown;
window.attachCheckboxHandlers = attachCheckboxHandlers;
window.showToast = showToast;
window.toggleCheckboxInMarkdown = toggleCheckboxInMarkdown;
window.CV_ICONS = CV_ICONS;
window.CV_SVG_SORT_UP = CV_SVG_SORT_UP;
window.CV_SVG_SORT_DOWN = CV_SVG_SORT_DOWN;
})();
