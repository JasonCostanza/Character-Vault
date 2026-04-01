// ── Counters Module Type ──
(function () {
'use strict';

// ── ID Generation ──
function generateCounterId() {
    return 'counter_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Confirmation Dialog ──
function showConfirm(options, onConfirm) {
    var message = typeof options === 'string' ? options : options.message;
    var titleText = options.title || t('counter.delete');

    var overlay = document.createElement('div');
    overlay.className = 'delete-confirm-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    var panel = document.createElement('div');
    panel.className = 'delete-confirm-panel';

    var title = document.createElement('div');
    title.className = 'delete-confirm-title';
    title.style.userSelect = 'none';
    title.textContent = titleText;

    var msg = document.createElement('div');
    msg.className = 'delete-confirm-msg';
    msg.style.userSelect = 'none';
    msg.textContent = message;

    var actions = document.createElement('div');
    actions.className = 'delete-confirm-actions';

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'delete-confirm-cancel btn-secondary';
    cancelBtn.textContent = options.cancelText || t('delete.cancel');

    var confirmBtn = document.createElement('button');
    confirmBtn.className = 'delete-confirm-delete';
    confirmBtn.textContent = options.confirmText || t('delete.confirm');

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    panel.appendChild(title);
    panel.appendChild(msg);
    panel.appendChild(actions);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    function close() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        setTimeout(function () { overlay.remove(); }, 200);
    }

    cancelBtn.addEventListener('click', close);
    confirmBtn.addEventListener('click', function () {
        onConfirm();
        close();
    });

    // Close on overlay click
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();
    });

    requestAnimationFrame(function () {
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
    });
}

// ── Content Shape Guard ──
function ensureContent(data) {
    if (!data.content || typeof data.content === 'string') {
        data.content = { counters: [], sortBy: 'custom', sortDir: 'asc' };
    }
    if (!Array.isArray(data.content.counters)) data.content.counters = [];
    if (!data.content.sortBy) data.content.sortBy = 'custom';
    if (!data.content.sortDir) data.content.sortDir = 'asc';
    return data.content;
}

// ── Counter Icon Library ──
// 32 icons across 6 categories — inline SVG using basic shapes per project conventions
var COUNTER_ICON_SVG = {
    // Generic
    star:     '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    circle:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>',
    square:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>',
    triangle: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 22 2 22"/></svg>',
    diamond:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 12 12 22 2 12"/></svg>',

    // Time
    hourglass: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v4l-5 5 5 5v4H6v-4l5-5-5-5V2z"/><line x1="6" y1="2" x2="18" y2="2"/><line x1="6" y1="22" x2="18" y2="22"/></svg>',
    clock:     '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    stopwatch: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="8"/><line x1="12" y1="14" x2="12" y2="10"/><line x1="10" y1="2" x2="14" y2="2"/><line x1="18.5" y1="7.5" x2="20" y2="6"/></svg>',
    bell:      '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    timer:     '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="9"/><polyline points="12 9 12 13 15 16"/><line x1="12" y1="1" x2="12" y2="4"/></svg>',

    // Combat
    sword:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="2" x2="7" y2="18"/><line x1="21" y1="6" x2="12" y2="6"/><path d="M5 20l2-2"/><path d="M3 22l2-2"/></svg>',
    shield: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 7v6c0 5.25 3.75 9.5 9 11 5.25-1.5 9-5.75 9-11V7l-9-5z"/></svg>',
    flame:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4-2-7-6-7-11 0-3 2-6 4-7 0 3 2 5 3 5 0-4 2-8 5-9 0 4 1 7 1 10 2 0 3-2 3-4 2 2 3 5 3 6 0 5-3 9-7 11-1 .5-3 .5-5-1z"/></svg>',
    bolt:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    target: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',

    // Resources
    coin:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M9 9h3.5a2 2 0 010 4H9m0 0h4a2 2 0 010 4H9"/></svg>',
    gem:    '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14l3 5-10 13L2 9l3-5z"/><line x1="2" y1="9" x2="22" y2="9"/></svg>',
    potion: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6v3l4 7A6 6 0 015 13l4-7V3z"/><line x1="8" y1="9" x2="16" y2="9"/></svg>',
    apple:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1-1 3-1.5 4 0"/><path d="M17 6c2 2 3 5 2.5 9s-2.5 6-5.5 7c-1 .3-1.7.3-2 0-3-1-5-3-5.5-7S7 8 9 6c1-1 3-1 4 0s2-.5 4 0z"/></svg>',
    water:  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 8 5 12 5 16a7 7 0 0014 0c0-4-3-8-7-14z"/></svg>',

    // Miscellaneous
    scroll:           '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h12a2 2 0 002-2V5a2 2 0 00-2-2H8l-4 4v12a2 2 0 002 2z"/><path d="M4 7h4v-4"/><line x1="10" y1="11" x2="16" y2="11"/><line x1="10" y1="15" x2="14" y2="15"/></svg>',
    skull:            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="8"/><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none"/><path d="M9 18v4"/><path d="M15 18v4"/><path d="M12 18v4"/></svg>',
    'skull-crossbones': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="7"/><circle cx="9.5" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="14.5" cy="8" r="1.5" fill="currentColor" stroke="none"/><path d="M8 16l8 6"/><path d="M16 16l-8 6"/></svg>',
    eye:              '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    hand:             '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17V8a1.5 1.5 0 013 0v5"/><path d="M12 11V7a1.5 1.5 0 013 0v4"/><path d="M15 11V8.5a1.5 1.5 0 013 0V17a5 5 0 01-10 0v-2.5a1.5 1.5 0 013 0"/><path d="M6 13V9a1.5 1.5 0 013 0"/></svg>',

    // Sci-Fi
    rocket:    '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 6 6 10 6 16h12c0-6-2-10-6-14z"/><line x1="9" y1="22" x2="9" y2="16"/><line x1="15" y1="22" x2="15" y2="16"/><circle cx="12" cy="12" r="2"/></svg>',
    laser:     '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="10" y2="12"/><polygon points="10 8 22 12 10 16 10 8"/><line x1="2" y1="8" x2="6" y2="8"/><line x1="2" y1="16" x2="6" y2="16"/></svg>',
    radiation: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 9C11 5 9 2 6 2c0 4 1 6 3 8"/><path d="M15 12c4-1 7-3 7-6-4 0-6 1-8 3"/><path d="M12 15c1 4 3 7 6 7 0-4-1-6-3-8"/><path d="M9 12c-4 1-7 3-7 6 4 0 6-1 8-3"/></svg>',
    circuit:   '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none"/><line x1="8" y1="9.5" x2="8" y2="14.5"/><line x1="16" y1="9.5" x2="16" y2="14.5"/><line x1="9.5" y1="8" x2="14.5" y2="8"/></svg>',
    energy:    '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/><line x1="7" y1="2" x2="5" y2="6"/><line x1="19" y1="18" x2="17" y2="22"/></svg>',
    robot:     '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="14" height="12" rx="2"/><line x1="12" y1="4" x2="12" y2="7"/><circle cx="12" cy="3" r="1"/><circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/><line x1="9" y1="16" x2="15" y2="16"/></svg>',
    wrench:    '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>'
};

// Icon picker data — organized by category for display in modals
var COUNTER_ICON_CATEGORIES = [
    { label: 'counter.iconGeneric', keys: ['star', 'circle', 'square', 'triangle', 'diamond'] },
    { label: 'counter.iconTime',    keys: ['hourglass', 'clock', 'stopwatch', 'bell', 'timer'] },
    { label: 'counter.iconCombat',  keys: ['sword', 'shield', 'flame', 'bolt', 'target'] },
    { label: 'counter.iconResource',keys: ['coin', 'gem', 'potion', 'apple', 'water'] },
    { label: 'counter.iconMisc',    keys: ['scroll', 'skull', 'skull-crossbones', 'eye', 'hand'] },
    { label: 'counter.iconSciFi',   keys: ['rocket', 'laser', 'radiation', 'circuit', 'energy', 'robot', 'wrench'] }
];

// Icon key→label map for tooltips
var COUNTER_ICON_LABELS = {
    star: 'Star', circle: 'Circle', square: 'Square', triangle: 'Triangle', diamond: 'Diamond',
    hourglass: 'Hourglass', clock: 'Clock', stopwatch: 'Stopwatch', bell: 'Bell', timer: 'Timer',
    sword: 'Sword', shield: 'Shield', flame: 'Flame', bolt: 'Bolt', target: 'Target',
    coin: 'Coin', gem: 'Gem', potion: 'Potion', apple: 'Apple', water: 'Water',
    scroll: 'Scroll', skull: 'Skull', 'skull-crossbones': 'Skull & Crossbones', eye: 'Eye', hand: 'Hand',
    rocket: 'Rocket', laser: 'Laser', radiation: 'Radiation', circuit: 'Circuit', energy: 'Energy', robot: 'Robot', wrench: 'Wrench'
};

// ── Sorted Counter List ──
function getSortedCounters(content) {
    var counters = content.counters.slice();
    var sortBy = content.sortBy;
    var sortDir = content.sortDir;

    if (sortBy === 'custom' || !sortBy) {
        counters.sort(function (a, b) { return a.order - b.order; });
    } else if (sortBy === 'name') {
        counters.sort(function (a, b) {
            var cmp = (a.name || '').localeCompare(b.name || '');
            return sortDir === 'desc' ? -cmp : cmp;
        });
    } else if (sortBy === 'value') {
        counters.sort(function (a, b) {
            var cmp = a.value - b.value;
            return sortDir === 'desc' ? -cmp : cmp;
        });
    }
    return counters;
}

// ── Icon Picker Builder ──
function buildIconPicker(container, selectedKey, onSelect) {
    var picker = document.createElement('div');
    picker.className = 'counter-icon-picker';

    // "None" option
    var noneBtn = document.createElement('button');
    noneBtn.type = 'button';
    noneBtn.className = 'counter-icon-pick-btn' + (selectedKey === null ? ' selected' : '');
    noneBtn.dataset.iconKey = '';
    noneBtn.title = t('counter.iconNone');
    noneBtn.innerHTML = '<span class="counter-icon-none-label">&mdash;</span>';
    noneBtn.addEventListener('click', function () {
        picker.querySelectorAll('.counter-icon-pick-btn').forEach(function (b) { b.classList.remove('selected'); });
        noneBtn.classList.add('selected');
        onSelect(null);
    });
    picker.appendChild(noneBtn);

    COUNTER_ICON_CATEGORIES.forEach(function (cat) {
        cat.keys.forEach(function (key) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'counter-icon-pick-btn' + (key === selectedKey ? ' selected' : '');
            btn.dataset.iconKey = key;
            btn.title = COUNTER_ICON_LABELS[key] || key;
            btn.innerHTML = COUNTER_ICON_SVG[key] || '';
            btn.addEventListener('click', function () {
                picker.querySelectorAll('.counter-icon-pick-btn').forEach(function (b) { b.classList.remove('selected'); });
                btn.classList.add('selected');
                onSelect(key);
            });
            picker.appendChild(btn);
        });
    });

    container.appendChild(picker);
    return picker;
}

// ── Creation Modal ──
function openCounterCreateModal(moduleEl, data) {
    var content = ensureContent(data);
    var modalState = { name: '', icon: null };

    var overlay = document.createElement('div');
    overlay.className = 'counter-modal-overlay';

    var panel = document.createElement('div');
    panel.className = 'counter-modal-panel';

    // Header
    var header = document.createElement('div');
    header.className = 'counter-modal-header';
    header.innerHTML =
        '<h3 class="counter-modal-title">' + escapeHtml(t('counter.createTitle')) + '</h3>' +
        '<button type="button" class="counter-modal-close" title="' + escapeHtml(t('counter.close')) + '">' +
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>';
    panel.appendChild(header);

    // Body
    var body = document.createElement('div');
    body.className = 'counter-modal-body';

    // Name field
    var nameLabel = document.createElement('label');
    nameLabel.className = 'counter-modal-label';
    nameLabel.textContent = t('counter.name');
    body.appendChild(nameLabel);

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'counter-modal-input';
    nameInput.placeholder = t('counter.namePlaceholder');
    nameInput.addEventListener('input', function () { modalState.name = nameInput.value; });
    nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doCreate();
        if (e.key === 'Escape') doClose();
    });
    body.appendChild(nameInput);

    // Icon picker
    var iconLabel = document.createElement('label');
    iconLabel.className = 'counter-modal-label';
    iconLabel.textContent = t('counter.icon');
    body.appendChild(iconLabel);

    buildIconPicker(body, null, function (key) { modalState.icon = key; });

    panel.appendChild(body);

    // Footer
    var footer = document.createElement('div');
    footer.className = 'counter-modal-footer';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'counter-modal-btn-cancel btn-secondary sm';
    cancelBtn.textContent = t('counter.cancel');
    cancelBtn.addEventListener('click', doClose);

    var createBtn = document.createElement('button');
    createBtn.type = 'button';
    createBtn.className = 'counter-modal-btn-create btn-primary solid';
    createBtn.textContent = t('counter.create');
    createBtn.addEventListener('click', doCreate);

    footer.appendChild(cancelBtn);
    footer.appendChild(createBtn);
    panel.appendChild(footer);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Close via X button
    header.querySelector('.counter-modal-close').addEventListener('click', doClose);

    // Close on overlay click
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) doClose();
    });

    // Auto-focus name
    requestAnimationFrame(function () { nameInput.focus(); });

    function doCreate() {
        var counter = {
            id: generateCounterId(),
            name: modalState.name.trim() || t('counter.unnamed'),
            icon: modalState.icon,
            value: 0,
            max: null,
            min: 0,
            order: content.counters.length
        };
        content.counters.push(counter);
        scheduleSave();
        doClose();
        reRenderCounterModule(moduleEl, data);
    }

    function doClose() {
        overlay.remove();
    }
}

// ── Edit Modal ──
function openCounterEditModal(moduleEl, data, counterId) {
    var content = ensureContent(data);
    var counter = content.counters.find(function (c) { return c.id === counterId; });
    if (!counter) return;

    // Snapshot for dirty checking
    var snapshot = {
        name: counter.name,
        icon: counter.icon,
        value: counter.value,
        max: counter.max,
        min: counter.min
    };

    var editState = {
        name: counter.name,
        icon: counter.icon,
        value: counter.value,
        max: counter.max,
        min: counter.min
    };

    var overlay = document.createElement('div');
    overlay.className = 'counter-modal-overlay';

    var panel = document.createElement('div');
    panel.className = 'counter-modal-panel counter-edit-panel';

    // Header
    var header = document.createElement('div');
    header.className = 'counter-modal-header';
    header.innerHTML =
        '<h3 class="counter-modal-title">' + escapeHtml(t('counter.editTitle')) + '</h3>' +
        '<button type="button" class="counter-modal-close" title="' + escapeHtml(t('counter.close')) + '">' +
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>';
    panel.appendChild(header);

    // Body
    var body = document.createElement('div');
    body.className = 'counter-modal-body counter-edit-body';

    // Name
    var nameLabel = document.createElement('label');
    nameLabel.className = 'counter-modal-label';
    nameLabel.textContent = t('counter.name');
    body.appendChild(nameLabel);

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'counter-modal-input';
    nameInput.value = editState.name;
    nameInput.placeholder = t('counter.namePlaceholder');
    nameInput.addEventListener('input', function () { editState.name = nameInput.value; });
    nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') doClose();
    });
    body.appendChild(nameInput);

    // Icon
    var iconLabel = document.createElement('label');
    iconLabel.className = 'counter-modal-label';
    iconLabel.textContent = t('counter.icon');
    body.appendChild(iconLabel);

    buildIconPicker(body, editState.icon, function (key) { editState.icon = key; });

    // Number fields row
    var fieldsRow = document.createElement('div');
    fieldsRow.className = 'counter-edit-fields';

    // Current Value
    var valField = document.createElement('div');
    valField.className = 'counter-edit-field';
    var valLabel = document.createElement('label');
    valLabel.className = 'counter-modal-label';
    valLabel.textContent = t('counter.currentValue');
    var valInput = document.createElement('input');
    valInput.type = 'number';
    valInput.className = 'counter-modal-input counter-modal-num';
    valInput.value = editState.value;
    valInput.addEventListener('input', function () {
        editState.value = parseInt(valInput.value, 10) || 0;
    });
    valField.appendChild(valLabel);
    valField.appendChild(valInput);
    fieldsRow.appendChild(valField);

    // Max Value
    var maxField = document.createElement('div');
    maxField.className = 'counter-edit-field';
    var maxLabel = document.createElement('label');
    maxLabel.className = 'counter-modal-label';
    maxLabel.textContent = t('counter.maxValue');
    var maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.className = 'counter-modal-input counter-modal-num';
    maxInput.value = editState.max !== null ? editState.max : '';
    maxInput.placeholder = t('counter.unlimited');
    maxInput.addEventListener('input', function () {
        if (maxInput.value === '') {
            editState.max = null;
        } else {
            editState.max = parseInt(maxInput.value, 10) || 0;
            // Auto-clamp value to max
            if (editState.value > editState.max) {
                editState.value = editState.max;
                valInput.value = editState.value;
            }
        }
    });
    maxField.appendChild(maxLabel);
    maxField.appendChild(maxInput);
    fieldsRow.appendChild(maxField);

    // Min Value
    var minField = document.createElement('div');
    minField.className = 'counter-edit-field';
    var minLabel = document.createElement('label');
    minLabel.className = 'counter-modal-label';
    minLabel.textContent = t('counter.minValue');
    var minInput = document.createElement('input');
    minInput.type = 'number';
    minInput.className = 'counter-modal-input counter-modal-num';
    minInput.value = editState.min;
    minInput.addEventListener('input', function () {
        editState.min = parseInt(minInput.value, 10) || 0;
    });
    minField.appendChild(minLabel);
    minField.appendChild(minInput);
    fieldsRow.appendChild(minField);

    body.appendChild(fieldsRow);
    panel.appendChild(body);

    // Footer
    var footer = document.createElement('div');
    footer.className = 'counter-modal-footer counter-edit-footer';

    var deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'counter-modal-btn-delete';
    deleteBtn.textContent = t('counter.delete');
    deleteBtn.addEventListener('click', function () {
        showConfirm(t('counter.deleteConfirm'), function () {
            var idx = content.counters.findIndex(function (c) { return c.id === counterId; });
            if (idx !== -1) content.counters.splice(idx, 1);
            // Re-index order values
            content.counters.forEach(function (c, i) { c.order = i; });
            scheduleSave();
            overlay.remove();
            reRenderCounterModule(moduleEl, data);
        });
    });

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'counter-modal-btn-cancel btn-secondary sm';
    closeBtn.textContent = t('counter.close');
    closeBtn.addEventListener('click', doClose);

    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'counter-modal-btn-create btn-primary solid';
    saveBtn.textContent = t('counter.save');
    saveBtn.addEventListener('click', doSave);

    footer.appendChild(deleteBtn);
    var rightBtns = document.createElement('div');
    rightBtns.className = 'counter-edit-footer-right';
    rightBtns.appendChild(closeBtn);
    rightBtns.appendChild(saveBtn);
    footer.appendChild(rightBtns);
    panel.appendChild(footer);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Wire close actions
    header.querySelector('.counter-modal-close').addEventListener('click', doClose);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) doClose();
    });

    // Auto-focus name
    requestAnimationFrame(function () { nameInput.focus(); });

    function isDirty() {
        return editState.name !== snapshot.name ||
               editState.icon !== snapshot.icon ||
               editState.value !== snapshot.value ||
               editState.max !== snapshot.max ||
               editState.min !== snapshot.min;
    }

    function doSave() {
        counter.name = editState.name.trim() || t('counter.unnamed');
        counter.icon = editState.icon;
        counter.value = editState.value;
        counter.max = editState.max;
        counter.min = editState.min;
        scheduleSave();
        overlay.remove();
        reRenderCounterModule(moduleEl, data);
    }

    function doClose() {
        if (isDirty()) {
            showConfirm({
                message: t('counter.discardPrompt'),
                title: t('counter.editTitle'),
                confirmText: t('counter.cancel') // "Cancel" as in "Cancel the edit which discards it"
            }, function () {
                overlay.remove();
            });
            // Note: Native confirm() blocks, but ours doesn't. 
            // We moved the removal into the callback.
        } else {
            overlay.remove();
        }
    }
}

// ── Re-render Helper ──
function reRenderCounterModule(moduleEl, data) {
    var bodyEl = moduleEl.querySelector('.module-body');
    var isPlayMode = document.getElementById('btn-mode-toggle').classList.contains('mode-play');
    MODULE_TYPES['counters'].renderBody(bodyEl, data, isPlayMode);
    snapModuleHeight(moduleEl, data);
}

// ── Play Mode: Counter Row ──
function renderCounterRowPlay(counter, data, moduleEl) {
    var content = data.content;
    var row = document.createElement('div');
    row.className = 'counter-row-play';
    row.dataset.counterId = counter.id;

    var atMax = counter.max !== null && counter.value >= counter.max;
    var atMin = counter.value <= counter.min;

    // Icon
    if (counter.icon && COUNTER_ICON_SVG[counter.icon]) {
        var iconWrap = document.createElement('span');
        iconWrap.className = 'counter-row-icon';
        iconWrap.innerHTML = COUNTER_ICON_SVG[counter.icon];
        row.appendChild(iconWrap);
    }

    // Name
    var nameEl = document.createElement('span');
    nameEl.className = 'counter-row-name';
    nameEl.textContent = counter.name;
    nameEl.title = counter.name;
    row.appendChild(nameEl);

    // Value display
    var valueEl = document.createElement('span');
    valueEl.className = 'counter-row-value';
    if (counter.max !== null) {
        valueEl.innerHTML = '<span class="counter-val-current">' + escapeHtml(String(counter.value)) + '</span>' +
                            '<span class="counter-val-sep"> / </span>' +
                            '<span class="counter-val-max">' + escapeHtml(String(counter.max)) + '</span>';
    } else {
        valueEl.innerHTML = '<span class="counter-val-current">' + escapeHtml(String(counter.value)) + '</span>';
    }
    row.appendChild(valueEl);

    // Reset button
    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'counter-reset-btn';
    resetBtn.title = t('counter.reset');
    resetBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>';
    resetBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        counter.value = counter.min;
        scheduleSave();
        reRenderCounterModule(moduleEl, data);
    });
    row.appendChild(resetBtn);

    // Boundary styling
    if (atMax) row.classList.add('counter-at-max');
    if (atMin) row.classList.add('counter-at-min');

    // Increment on click
    row.addEventListener('click', function (e) {
        if (e.target.closest('.counter-reset-btn')) return;
        if (counter.max !== null && counter.value >= counter.max) return;
        counter.value++;
        scheduleSave();
        reRenderCounterModule(moduleEl, data);
    });

    // Decrement on right-click
    row.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        if (counter.value <= counter.min) return;
        counter.value--;
        scheduleSave();
        reRenderCounterModule(moduleEl, data);
    });

    return row;
}

// ── Edit Mode: Counter Row ──
function renderCounterRowEdit(counter, data, moduleEl) {
    var content = data.content;
    var row = document.createElement('div');
    row.className = 'counter-row-edit';
    row.dataset.counterId = counter.id;

    // Drag handle
    var handle = document.createElement('span');
    handle.className = 'counter-drag-handle';
    handle.innerHTML = '&#x2807;';
    row.appendChild(handle);

    // Icon
    if (counter.icon && COUNTER_ICON_SVG[counter.icon]) {
        var iconWrap = document.createElement('span');
        iconWrap.className = 'counter-row-icon counter-row-icon-sm';
        iconWrap.innerHTML = COUNTER_ICON_SVG[counter.icon];
        row.appendChild(iconWrap);
    }

    // Name
    var nameEl = document.createElement('span');
    nameEl.className = 'counter-row-name';
    nameEl.textContent = counter.name;
    nameEl.title = counter.name;
    row.appendChild(nameEl);

    // Value preview
    var valueEl = document.createElement('span');
    valueEl.className = 'counter-row-value counter-row-value-edit';
    if (counter.max !== null) {
        valueEl.textContent = counter.value + ' / ' + counter.max;
    } else {
        valueEl.textContent = String(counter.value);
    }
    row.appendChild(valueEl);

    // Delete button
    var deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'counter-row-delete';
    deleteBtn.title = t('counter.deleteCounter');
    deleteBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    deleteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = content.counters.findIndex(function (c) { return c.id === counter.id; });
        if (idx !== -1) content.counters.splice(idx, 1);
        content.counters.forEach(function (c, i) { c.order = i; });
        scheduleSave();
        reRenderCounterModule(moduleEl, data);
    });
    row.appendChild(deleteBtn);

    // Click to open edit modal
    row.addEventListener('click', function (e) {
        if (e.target.closest('.counter-row-delete') || e.target.closest('.counter-drag-handle')) return;
        openCounterEditModal(moduleEl, data, counter.id);
    });

    return row;
}

// ── Column Headers ──
function renderCounterColumnHeaders(container, content, moduleEl, data) {
    var SVG_UP   = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
    var SVG_DOWN = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';

    var headerRow = document.createElement('div');
    headerRow.className = 'counter-header-row';

    // Icon spacer — only when any counter has an icon, to keep name column aligned
    if (content.counters.some(function (c) { return c.icon; })) {
        var iconSpacer = document.createElement('div');
        iconSpacer.className = 'counter-col-header counter-col-icon-spacer';
        headerRow.appendChild(iconSpacer);
    }

    // Column definitions
    var cols = [
        { key: 'name',  cls: 'counter-col-name',  labelKey: 'list.colName' },
        { key: 'value', cls: 'counter-col-value',  labelKey: 'counter.colValue' }
    ];

    cols.forEach(function (col) {
        var isActive = content.sortBy === col.key;
        var colEl = document.createElement('div');
        colEl.className = 'counter-col-header ' + col.cls + (isActive ? ' active-sort' : '');
        colEl.title = escapeHtml(isActive
            ? (content.sortDir === 'asc' ? t('list.sortDesc') : t('list.sortManual'))
            : t('list.sortAsc'));

        var label = document.createElement('span');
        label.className = 'list-col-header-label';
        label.textContent = t(col.labelKey);
        colEl.appendChild(label);

        if (isActive) {
            var indicator = document.createElement('span');
            indicator.className = 'list-sort-indicator';
            indicator.innerHTML = content.sortDir === 'asc' ? SVG_UP : SVG_DOWN;
            colEl.appendChild(indicator);
        }

        colEl.addEventListener('click', function () {
            if (content.sortBy === col.key) {
                if (content.sortDir === 'asc') {
                    content.sortDir = 'desc';
                } else {
                    content.sortBy = 'custom';
                    content.sortDir = 'asc';
                }
            } else {
                content.sortBy = col.key;
                content.sortDir = 'asc';
            }
            scheduleSave();
            reRenderCounterModule(moduleEl, data);
        });

        headerRow.appendChild(colEl);
    });

    // Actions spacer — aligns with reset button column
    var actionsSpacer = document.createElement('div');
    actionsSpacer.className = 'counter-col-header counter-col-actions';
    headerRow.appendChild(actionsSpacer);

    container.appendChild(headerRow);
}

// ── SortableJS for Edit Mode Reorder ──
function initCounterSortable(container, data) {
    var content = data.content;
    container._sortable = new Sortable(container, {
        handle: '.counter-drag-handle',
        animation: 150,
        ghostClass: 'counter-ghost',
        draggable: '.counter-row-edit',
        onEnd: function () {
            var rows = Array.from(container.querySelectorAll('.counter-row-edit'));
            var reordered = rows.map(function (row) {
                return content.counters.find(function (c) { return c.id === row.dataset.counterId; });
            }).filter(Boolean);
            content.counters = reordered;
            content.counters.forEach(function (c, i) { c.order = i; });
            // Revert sort to custom when manually reordered
            content.sortBy = 'custom';
            content.sortDir = 'asc';
            scheduleSave();
        }
    });
}

// ── Module Type Registration ──
registerModuleType('counters', {
    label: 'type.counters',

    renderBody: function (bodyEl, data, isPlayMode) {
        var content = ensureContent(data);
        var container = document.createElement('div');
        container.className = 'counter-container';
        var moduleEl = bodyEl.closest('.module');

        if (isPlayMode) {
            // Sort controls
            if (content.counters.length > 0) {
                renderCounterColumnHeaders(container, content, moduleEl, data);
            }

            // Counter list
            var list = document.createElement('div');
            list.className = 'counter-list';
            var sorted = getSortedCounters(content);
            sorted.forEach(function (counter) {
                list.appendChild(renderCounterRowPlay(counter, data, moduleEl));
            });

            if (content.counters.length === 0) {
                var empty = document.createElement('div');
                empty.className = 'counter-empty-state';
                empty.textContent = t('counter.emptyState');
                list.appendChild(empty);
            }

            container.appendChild(list);
        } else {
            // Edit mode list
            var list = document.createElement('div');
            list.className = 'counter-list counter-list-edit';

            // In edit mode, always show custom order
            var sorted = content.counters.slice().sort(function (a, b) { return a.order - b.order; });
            sorted.forEach(function (counter) {
                list.appendChild(renderCounterRowEdit(counter, data, moduleEl));
            });

            if (content.counters.length === 0) {
                var empty = document.createElement('div');
                empty.className = 'counter-empty-state';
                empty.textContent = t('counter.emptyState');
                list.appendChild(empty);
            }

            container.appendChild(list);

            // Init drag-to-reorder
            if (content.counters.length > 1) {
                initCounterSortable(list, data);
            }
        }

        bodyEl.innerHTML = '';
        bodyEl.appendChild(container);
    },

    onPlayMode: function (moduleEl, data) {
        var bodyEl = moduleEl.querySelector('.module-body');
        this.renderBody(bodyEl, data, true);
    },

    onEditMode: function (moduleEl, data) {
        var bodyEl = moduleEl.querySelector('.module-body');
        this.renderBody(bodyEl, data, false);
    },

    syncState: function (moduleEl, data) {
        // Counter data is mutated directly via modals, nothing to sync from DOM
    }
});

// Expose for module-core toolbar wiring
window.openCounterCreateModal = openCounterCreateModal;
window.COUNTER_ICON_SVG = COUNTER_ICON_SVG;

})();
