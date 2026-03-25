// ── Module State ──
let modules = [];
let moduleIdCounter = 0;

function generateModuleId() {
    return `module-${String(++moduleIdCounter).padStart(3, '0')}`;
}

// ── New Module Wizard ──
const wizardOverlay = document.getElementById('wizard-overlay');
const btnNewModule = document.getElementById('btn-new-module');
const btnWizardClose = document.getElementById('btn-wizard-close');
const btnWizardCancel = document.getElementById('btn-wizard-cancel');
const btnWizardCreate = document.getElementById('btn-wizard-create');
const wizardTypeCards = document.querySelectorAll('.wizard-type-card');
const wizardSwatches = document.querySelectorAll('.wizard-swatch');

let lastWizardType = null;

let wizardState = {
    type: 'text',
    theme: null,
    statLayout: 'large-stat',
    statTemplate: ''
};

function openWizard() {
    resetWizard();
    wizardOverlay.classList.add('open');
    wizardOverlay.setAttribute('aria-hidden', 'false');
}

function closeWizard() {
    wizardOverlay.classList.remove('open');
    wizardOverlay.setAttribute('aria-hidden', 'true');
}

function resetWizard() {
    // Pick remembered type, or first non-disabled card
    const firstAvailable = Array.from(wizardTypeCards).find(c => !c.classList.contains('disabled'));
    const defaultType = lastWizardType || (firstAvailable ? firstAvailable.dataset.type : 'text');

    wizardState = { type: defaultType, theme: null, statLayout: 'large-stat', statTemplate: '' };

    wizardTypeCards.forEach(card => {
        card.classList.toggle('selected', card.dataset.type === defaultType);
    });

    wizardSwatches.forEach(sw => {
        sw.classList.toggle('selected', sw.dataset.color === '');
    });

    const customHex = document.getElementById('wizard-custom-hex');
    const customSwatch = document.querySelector('.wizard-swatch-custom');
    if (customHex) { customHex.value = ''; customHex.classList.remove('visible'); }
    if (customSwatch) { customSwatch.style.backgroundColor = ''; customSwatch.classList.remove('has-color'); }

    const themeSection = document.getElementById('wizard-theme-section');
    if (themeSection) themeSection.style.display = (defaultType === 'hline' || defaultType === 'spacer') ? 'none' : '';

    const statLayoutSection = document.getElementById('wizard-stat-layout');
    if (statLayoutSection) {
        statLayoutSection.classList.toggle('visible', defaultType === 'stat');
        statLayoutSection.querySelectorAll('.wizard-layout-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.layout === 'large-stat');
        });
    }

    const statTemplateSection = document.getElementById('wizard-stat-template');
    if (statTemplateSection) {
        statTemplateSection.classList.toggle('visible', defaultType === 'stat');
        const templateSelect = document.getElementById('wizard-stat-template-select');
        if (templateSelect) {
            templateSelect.classList.remove('open');
            const opts = templateSelect.querySelectorAll('.cv-select-option');
            opts.forEach(o => o.classList.remove('selected'));
            const firstOpt = opts[0];
            if (firstOpt) {
                firstOpt.classList.add('selected');
                const valSpan = templateSelect.querySelector('.cv-select-value');
                if (valSpan) valSpan.textContent = firstOpt.textContent;
            }
        }
    }
}

btnNewModule.addEventListener('click', openWizard);
btnWizardClose.addEventListener('click', closeWizard);
btnWizardCancel.addEventListener('click', closeWizard);

// ── Global Escape Key ──
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (activeOverflowMenu) {
            closeOverflowMenu();
        } else if (deleteConfirmOverlay.classList.contains('open')) {
            closeDeleteConfirm();
        } else if (wizardOverlay.classList.contains('open')) {
            closeWizard();
        } else if (settingsOverlay.classList.contains('open')) {
            closeSettings();
        }
    }
});

// Type card selection
const wizardThemeSection = document.getElementById('wizard-theme-section');
const wizardStatLayout = document.getElementById('wizard-stat-layout');
wizardTypeCards.forEach(card => {
    card.addEventListener('click', () => {
        if (card.classList.contains('disabled')) return;
        wizardTypeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        wizardState.type = card.dataset.type;
        wizardThemeSection.style.display = (wizardState.type === 'hline' || wizardState.type === 'spacer') ? 'none' : '';
        wizardStatLayout.classList.toggle('visible', wizardState.type === 'stat');
        const statTemplateEl = document.getElementById('wizard-stat-template');
        if (statTemplateEl) statTemplateEl.classList.toggle('visible', wizardState.type === 'stat');
    });
});

// Stat layout button selection
wizardStatLayout.querySelectorAll('.wizard-layout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        wizardStatLayout.querySelectorAll('.wizard-layout-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        wizardState.statLayout = btn.dataset.layout;
    });
});

// Stat template selection (custom cv-select)
const wizardStatTemplateSelect = document.getElementById('wizard-stat-template-select');
if (wizardStatTemplateSelect) {
    const trigger = wizardStatTemplateSelect.querySelector('.cv-select-trigger');
    const valueSpan = wizardStatTemplateSelect.querySelector('.cv-select-value');
    const options = wizardStatTemplateSelect.querySelectorAll('.cv-select-option');

    trigger.addEventListener('click', () => {
        wizardStatTemplateSelect.classList.toggle('open');
        trigger.setAttribute('aria-expanded', wizardStatTemplateSelect.classList.contains('open'));
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            valueSpan.textContent = option.textContent;
            wizardState.statTemplate = option.dataset.value;
            wizardStatTemplateSelect.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!wizardStatTemplateSelect.contains(e.target)) {
            wizardStatTemplateSelect.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}

// Color swatch selection
const wizardCustomHex = document.getElementById('wizard-custom-hex');
const wizardCustomSwatch = document.querySelector('.wizard-swatch-custom');

wizardSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
        if (swatch.dataset.color === 'custom') {
            wizardSwatches.forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            wizardCustomHex.classList.add('visible');
            wizardCustomHex.focus();
            wizardState.theme = wizardCustomHex.value.match(/^#[0-9A-Fa-f]{6}$/) ? wizardCustomHex.value : null;
            return;
        }
        wizardSwatches.forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        wizardCustomHex.classList.remove('visible');
        wizardCustomSwatch.style.backgroundColor = '';
        wizardCustomSwatch.classList.remove('has-color');
        wizardState.theme = swatch.dataset.color || null;
    });
});

wizardCustomHex.addEventListener('input', () => {
    const val = wizardCustomHex.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        wizardCustomSwatch.style.backgroundColor = val;
        wizardCustomSwatch.classList.add('has-color');
        wizardState.theme = val;
    } else {
        wizardCustomSwatch.style.backgroundColor = '';
        wizardCustomSwatch.classList.remove('has-color');
        wizardState.theme = null;
    }
});

// ── Create Module ──
btnWizardCreate.addEventListener('click', () => {
    const moduleData = {
        id: generateModuleId(),
        type: wizardState.type,
        title: null,
        colSpan: 2,
        rowSpan: 2,
        order: modules.length,
        theme: wizardState.theme,
        content: ''
    };

    if (moduleData.type === 'hline') {
        moduleData.colSpan = 4;
        moduleData.rowSpan = null;
        moduleData.theme = null;
    }

    if (moduleData.type === 'spacer') {
        moduleData.colSpan = 1;
        moduleData.rowSpan = 1;
        moduleData.theme = null;
    }

    if (moduleData.type === 'health') {
        moduleData.content = { currentHP: 0, maxHP: 0, tempHP: 0, maxHPModifier: 0 };
        moduleData.colSpan = 1;
        moduleData.rowSpan = null;
    }

    if (moduleData.type === 'stat') {
        const templateStats = wizardState.statTemplate ? applyStatTemplate(wizardState.statTemplate) : [];
        moduleData.content = { layout: wizardState.statLayout, stats: templateStats };
        if (wizardState.statTemplate && wizardStatTemplateSelect) {
            const selectedOption = wizardStatTemplateSelect.querySelector('.cv-select-option.selected');
            if (selectedOption) moduleData.title = selectedOption.textContent.trim() + ' Stats';
        }
        moduleData.colSpan = 1;
        // Auto-height so stat blocks aren't clipped by a fixed rowSpan
        moduleData.rowSpan = null;
    }

    lastWizardType = moduleData.type;
    modules.push(moduleData);
    renderModule(moduleData);
    updateEmptyState();
    closeWizard();
    console.log(`[CV] Module created: ${moduleData.id} (${moduleData.type})`);
    scheduleSave();
});

// ── Module Type Registry ──
// Each module type registers: label, renderBody, onPlayMode, onEditMode.
// renderBody(bodyEl, data, isPlayMode) — populate the .module-body element.
// onPlayMode(moduleEl, data) — switch this module to play mode.
// onEditMode(moduleEl, data) — switch this module to edit mode.
const MODULE_TYPES = {};

function registerModuleType(type, { label, renderBody, onPlayMode, onEditMode, syncState }) {
    MODULE_TYPES[type] = { label, renderBody, onPlayMode, onEditMode, syncState };
}

// ── Module Rendering ──
const moduleGrid = document.getElementById('module-grid');
const emptyState = document.getElementById('empty-state');

function updateEmptyState() {
    emptyState.style.display = modules.length === 0 ? 'flex' : 'none';
}

// ── Module Overflow Menu ──
let activeOverflowMenu = null;

function openOverflowMenu(moduleEl, overflowBtn) {
    closeOverflowMenu();
    closeThemePopover();

    const menu = document.createElement('div');
    menu.className = 'module-overflow-menu';

    const btnDefs = [
        { sel: '.module-health-maxmod-btn', label: t('health.moduleSettings'), icon: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
        { sel: '.module-health-eyedropper-btn', label: t('health.eyedropper'), icon: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>' },
        { sel: '.module-addstat-btn', label: t('stat.addStat'), icon: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' },
        { sel: '.module-rollable-btn', label: t('stat.toggleRollable'), icon: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 20 7 20 17 12 22 4 17 4 7"/><text x="12" y="15" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor" stroke="none">20</text></svg>' },
        { sel: '.module-swaplayout-btn', label: t('stat.swapLayout'), icon: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 3 3 7 7 11"/><line x1="3" y1="7" x2="21" y2="7"/><polyline points="17 13 21 17 17 21"/><line x1="21" y1="17" x2="3" y2="17"/></svg>' },
        { sel: '.module-copy-btn', label: t('module.copyClipboard'), icon: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' },
        { sel: '.module-delete-btn', label: t('module.deleteModule'), icon: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>', cls: 'danger' },
    ];

    // Add "Change Theme" item for modules that support theming
    const moduleType = moduleEl.dataset.type;
    if (moduleType !== 'hline' && moduleType !== 'spacer') {
        const themeIcon = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.37 2.63a2.12 2.12 0 0 1 3 3L14 13l-4 1 1-4 7.37-7.37z"/><path d="M9 3.5a7.5 7.5 0 1 0 5.59 12.5"/><path d="M7.5 16.5c0 1.38-1.12 2.5-2.5 2.5S2.5 19.38 2.5 18c0-2 2.5-3 2.5-3s2.5 1 2.5 3z"/></svg>';
        const themeItem = document.createElement('button');
        themeItem.className = 'module-overflow-menu-item';
        themeItem.innerHTML = themeIcon + `<span>${escapeHtml(t('module.changeTheme'))}</span>`;
        themeItem.addEventListener('click', (e) => {
            e.stopPropagation();
            showThemeSwatchPanel(menu, moduleEl);
        });
        menu.appendChild(themeItem);
    }

    btnDefs.forEach(def => {
        const realBtn = moduleEl.querySelector(def.sel);
        if (!realBtn) return;
        const item = document.createElement('button');
        item.className = 'module-overflow-menu-item' + (def.cls ? ' ' + def.cls : '');
        item.innerHTML = def.icon + `<span>${escapeHtml(def.label)}</span>`;
        item.addEventListener('click', () => {
            realBtn.click();
            closeOverflowMenu();
        });
        menu.appendChild(item);
    });

    document.body.appendChild(menu);

    // Position below the kebab button
    const rect = overflowBtn.getBoundingClientRect();
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.left = rect.left + 'px';

    // Clamp to viewport
    const menuRect = menu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
        menu.style.left = (window.innerWidth - menuRect.width - 4) + 'px';
    }
    if (menuRect.bottom > window.innerHeight) {
        menu.style.top = (rect.top - menuRect.height - 4) + 'px';
    }

    activeOverflowMenu = menu;

    requestAnimationFrame(() => {
        document.addEventListener('click', handleOverflowOutsideClick);
    });
}

function closeOverflowMenu() {
    if (activeOverflowMenu) {
        activeOverflowMenu.remove();
        activeOverflowMenu = null;
        document.removeEventListener('click', handleOverflowOutsideClick);
    }
}

function handleOverflowOutsideClick(e) {
    if (activeOverflowMenu && !activeOverflowMenu.contains(e.target)) {
        closeOverflowMenu();
    }
}

const THEME_SWATCHES = [
    { color: '',        key: 'wizard.swatchDefault', cls: 'overflow-swatch-default' },
    { color: '#8B2020', key: 'wizard.swatchCrimson' },
    { color: '#2D5A3D', key: 'wizard.swatchForest' },
    { color: '#1E3A5F', key: 'wizard.swatchNavy' },
    { color: '#4A2D6B', key: 'wizard.swatchRoyal' },
    { color: '#5C3A1E', key: 'wizard.swatchLeather' },
    { color: '#3A3A3A', key: 'wizard.swatchSlate' },
];

function buildSwatchPanel(container, moduleEl, data, onClose) {
    const label = document.createElement('div');
    label.className = 'overflow-theme-label';
    label.textContent = t('module.changeTheme');
    container.appendChild(label);

    const row = document.createElement('div');
    row.className = 'overflow-swatch-row';

    THEME_SWATCHES.forEach(sw => {
        const btn = document.createElement('button');
        btn.className = 'overflow-swatch' + (sw.cls ? ' ' + sw.cls : '');
        btn.title = t(sw.key);
        if (sw.color) btn.style.backgroundColor = sw.color;
        const current = data.theme || '';
        if (sw.color === current) btn.classList.add('selected');

        btn.addEventListener('click', () => {
            data.theme = sw.color || null;
            moduleEl.style.backgroundColor = sw.color || '';
            scheduleSave();
            onClose();
        });
        row.appendChild(btn);
    });

    // Custom color swatch
    const customBtn = document.createElement('button');
    customBtn.className = 'overflow-swatch overflow-swatch-custom';
    customBtn.title = t('wizard.swatchCustom');
    customBtn.textContent = '#';
    const currentTheme = data.theme || '';
    const isCustom = currentTheme && !THEME_SWATCHES.some(sw => sw.color === currentTheme);
    if (isCustom) {
        customBtn.style.backgroundColor = currentTheme;
        customBtn.classList.add('has-color', 'selected');
    }

    customBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        row.querySelectorAll('.overflow-swatch').forEach(s => s.classList.remove('selected'));
        customBtn.classList.add('selected');
        hexInput.classList.add('visible');
        hexInput.focus();
    });
    row.appendChild(customBtn);

    // Custom hex input
    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'overflow-custom-hex';
    hexInput.placeholder = '#000000';
    hexInput.maxLength = 7;
    hexInput.spellcheck = false;
    if (isCustom) {
        hexInput.value = currentTheme;
        hexInput.classList.add('visible');
    }

    hexInput.addEventListener('input', () => {
        const val = hexInput.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            customBtn.style.backgroundColor = val;
            customBtn.classList.add('has-color');
            data.theme = val;
            moduleEl.style.backgroundColor = val;
            scheduleSave();
        } else {
            customBtn.style.backgroundColor = '';
            customBtn.classList.remove('has-color');
        }
    });

    hexInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onClose();
    });

    hexInput.addEventListener('click', (e) => e.stopPropagation());

    row.appendChild(hexInput);
    container.appendChild(row);
}

function showThemeSwatchPanel(menu, moduleEl) {
    const data = modules.find(m => m.id === moduleEl.dataset.id);
    if (!data) return;
    menu.innerHTML = '';
    buildSwatchPanel(menu, moduleEl, data, closeOverflowMenu);
}

// ── Theme Popover (header button) ──
let activeThemePopover = null;

function openThemePopover(moduleEl, anchorBtn) {
    closeThemePopover();
    const data = modules.find(m => m.id === moduleEl.dataset.id);
    if (!data) return;

    const popover = document.createElement('div');
    closeOverflowMenu();
    popover.className = 'module-theme-popover';

    buildSwatchPanel(popover, moduleEl, data, closeThemePopover);
    document.body.appendChild(popover);

    // Position below the anchor button
    const rect = anchorBtn.getBoundingClientRect();
    popover.style.top = (rect.bottom + 4) + 'px';
    popover.style.left = rect.left + 'px';

    // Clamp to viewport
    const popRect = popover.getBoundingClientRect();
    if (popRect.right > window.innerWidth) {
        popover.style.left = (window.innerWidth - popRect.width - 4) + 'px';
    }
    if (popRect.bottom > window.innerHeight) {
        popover.style.top = (rect.top - popRect.height - 4) + 'px';
    }

    activeThemePopover = popover;

    requestAnimationFrame(() => {
        document.addEventListener('click', handleThemePopoverOutsideClick);
    });
}

function closeThemePopover() {
    if (activeThemePopover) {
        activeThemePopover.remove();
        activeThemePopover = null;
        document.removeEventListener('click', handleThemePopoverOutsideClick);
    }
}

function handleThemePopoverOutsideClick(e) {
    if (activeThemePopover && !activeThemePopover.contains(e.target)) {
        closeThemePopover();
    }
}

function renderModule(data) {
    const typeDef = MODULE_TYPES[data.type];
    if (!typeDef) {
        console.warn(`[CV] Unknown module type: ${data.type}`);
        return;
    }

    const el = document.createElement('div');
    el.className = 'module';
    el.dataset.id = data.id;
    el.dataset.type = data.type;
    el.style.gridColumn = `span ${data.colSpan}`;

    if (data.rowSpan) {
        el.style.height = `${(data.rowSpan * ROW_H) + ((data.rowSpan - 1) * GRID_GAP)}px`;
    }

    if (data.theme) {
        el.style.backgroundColor = data.theme;
    }

    const isPlayMode = modeToggle.classList.contains('mode-play');

    const showResize = data.type !== 'hline';
    const displayTitle = data.title || t(typeDef.label);
    el.innerHTML = `
        <div class="module-header">
            <span class="module-drag-handle" style="${isPlayMode ? 'display:none' : ''}">&#x2807;</span>
            <span class="module-type-label" style="${isPlayMode ? '' : 'display:none'}">${escapeHtml(displayTitle)}</span>
            <input class="module-title-input" type="text" value="${escapeHtml(displayTitle)}" placeholder="${escapeHtml(t(typeDef.label))}" style="${isPlayMode ? 'display:none' : ''}" />
            <button class="module-overflow-btn" title="${t('module.moreOptions')}" style="${isPlayMode ? 'display:none' : ''}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></button>
            ${data.type === 'health' ? `<button class="module-health-maxmod-btn" title="${t('health.moduleSettings')}" style="${isPlayMode ? 'display:none' : ''}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>` : ''}
            ${data.type === 'health' ? `<button class="module-health-eyedropper-btn" title="${t('health.eyedropper')}" style="${isPlayMode ? 'display:none' : ''}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg></button>` : ''}
            ${data.type === 'stat' ? `<button class="module-addstat-btn" title="${t('stat.addStat')}" style="${isPlayMode ? 'display:none' : ''}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>` : ''}
            ${data.type === 'stat' ? `<button class="module-rollable-btn disabled" title="${t('stat.toggleRollable')}" style="${isPlayMode ? 'display:none' : ''}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 20 7 20 17 12 22 4 17 4 7"/><text x="12" y="15" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor" stroke="none">20</text></svg></button>` : ''}
            ${data.type === 'stat' ? `<button class="module-swaplayout-btn" title="${t('stat.swapLayout')}" style="${isPlayMode ? 'display:none' : ''}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 3 3 7 7 11"/><line x1="3" y1="7" x2="21" y2="7"/><polyline points="17 13 21 17 17 21"/><line x1="21" y1="17" x2="3" y2="17"/></svg></button>` : ''}
            ${data.type === 'text' ? `<button class="module-copy-btn" title="${t('module.copyClipboard')}" style="${isPlayMode ? 'display:none' : ''}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>` : ''}
            ${data.type !== 'hline' && data.type !== 'spacer' ? `<button class="module-theme-btn" title="${t('module.changeTheme')}" style="${isPlayMode ? 'display:none' : ''}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.37 2.63a2.12 2.12 0 0 1 3 3L14 13l-4 1 1-4 7.37-7.37z"/><path d="M9 3.5a7.5 7.5 0 1 0 5.59 12.5"/><path d="M7.5 16.5c0 1.38-1.12 2.5-2.5 2.5S2.5 19.38 2.5 18c0-2 2.5-3 2.5-3s2.5 1 2.5 3z"/></svg></button>` : ''}
            <button class="module-delete-btn" title="${t('module.deleteModule')}" style="${isPlayMode ? 'display:none' : ''}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
        </div>
        <div class="module-body"></div>
        ${showResize ? `<div class="module-resize-handle" title="${t('module.dragResize')}" style="${isPlayMode ? 'display:none' : ''}"></div>` : ''}
    `;

    el.querySelector('.module-delete-btn').addEventListener('click', () => {
        openDeleteConfirm(data.id);
    });

    // Add stat button (stat modules only — lives in header)
    const addStatBtn = el.querySelector('.module-addstat-btn');
    if (addStatBtn) {
        addStatBtn.addEventListener('click', () => {
            data.content.stats.push({ name: '', value: 0, modifier: 0, proficient: false, rollable: true });
            const bodyEl = el.querySelector('.module-body');
            const isPlay = modeToggle.classList.contains('mode-play');
            typeDef.renderBody(bodyEl, data, isPlay);
            snapModuleHeight(el, data);
            scheduleSave();
        });
    }

    // Rollable toggle (stat modules only — toggles rollable on selected stat)
    const rollableBtn = el.querySelector('.module-rollable-btn');
    if (rollableBtn) {
        rollableBtn.addEventListener('click', () => {
            const idx = el._selectedStatIndex;
            if (idx === null || idx === undefined || !data.content.stats[idx]) return;
            data.content.stats[idx].rollable = !data.content.stats[idx].rollable;
            updateRollableBtn(el, data);
            scheduleSave();
        });
    }

    // Swap layout toggle (stat modules only)
    const swapLayoutBtn = el.querySelector('.module-swaplayout-btn');
    if (swapLayoutBtn) {
        swapLayoutBtn.addEventListener('click', () => {
            data.content.layout = data.content.layout === 'large-stat' ? 'large-modifier' : 'large-stat';
            const bodyEl = el.querySelector('.module-body');
            const isPlay = modeToggle.classList.contains('mode-play');
            typeDef.renderBody(bodyEl, data, isPlay);
            snapModuleHeight(el, data);
            scheduleSave();
        });
    }

    // Max HP Modifier button (health modules only)
    const healthMaxModBtn = el.querySelector('.module-health-maxmod-btn');
    if (healthMaxModBtn) {
        healthMaxModBtn.addEventListener('click', () => {
            openHealthActionOverlay(el, data, 'maxmod');
        });
    }

    // Eyedropper button (health modules only — pull HP from selected creature)
    const healthEyedropperBtn = el.querySelector('.module-health-eyedropper-btn');
    if (healthEyedropperBtn) {
        healthEyedropperBtn.addEventListener('click', async () => {
            try {
                const selected = await TS.creatures.getSelectedCreatures();
                if (!selected || selected.length === 0) {
                    console.warn('[CV] Eyedropper: no creature selected on the board.');
                    return;
                }
                const moreInfo = await TS.creatures.getMoreInfo(selected);
                const creature = moreInfo[0];
                if (creature && creature.hp) {
                    data.content.currentHP = creature.hp.value;
                    data.content.maxHP = creature.hp.max;
                    const bodyEl = el.querySelector('.module-body');
                    const isPlay = modeToggle.classList.contains('mode-play');
                    typeDef.renderBody(bodyEl, data, isPlay);
                    scheduleSave();
                }
            } catch (e) {
                console.warn('[CV] Eyedropper failed — TS creature API may not be available:', e);
            }
        });
    }

    // Copy to clipboard (text modules only)
    const copyBtn = el.querySelector('.module-copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textarea = el.querySelector('.module-textarea');
            const text = textarea ? textarea.value : (data.content || '');
            const tmp = document.createElement('textarea');
            tmp.value = text;
            tmp.style.position = 'fixed';
            tmp.style.opacity = '0';
            document.body.appendChild(tmp);
            tmp.select();
            document.execCommand('copy');
            document.body.removeChild(tmp);
            copyBtn.classList.add('flash-confirm');
            setTimeout(() => copyBtn.classList.remove('flash-confirm'), 600);
        });
    }

    // Theme button (opens swatch popover)
    const themeBtn = el.querySelector('.module-theme-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openThemePopover(el, themeBtn);
        });
    }

    // Overflow menu (kebab button for narrow modules)
    const overflowBtn = el.querySelector('.module-overflow-btn');
    overflowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openOverflowMenu(el, overflowBtn);
    });

    // Title input — sync custom title to data
    const titleInput = el.querySelector('.module-title-input');
    titleInput.addEventListener('input', () => {
        const val = titleInput.value.trim();
        data.title = val && val !== t(typeDef.label) ? val : null;
        scheduleSave();
    });

    const bodyEl = el.querySelector('.module-body');
    typeDef.renderBody(bodyEl, data, isPlayMode);

    moduleGrid.appendChild(el);
    if (data.type !== 'hline') {
        initResizeHandle(el, data);
    }
    moduleSizeObserver.observe(bodyEl);
    snapModuleHeight(el, data);
}

// ── Module Drag & Drop (SortableJS) ──
const sortable = new Sortable(moduleGrid, {
    handle: '.module-drag-handle',
    animation: 150,
    ghostClass: 'module-ghost',
    chosenClass: 'module-dragging',
    dragClass: 'module-drag-active',
    filter: '#empty-state',
    disabled: modeToggle.classList.contains('mode-play'),
    onEnd(evt) {
        // Sync the modules array to match the new DOM order
        const orderedIds = Array.from(moduleGrid.querySelectorAll('.module'))
            .map(el => el.dataset.id);
        modules.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
        modules.forEach((m, i) => m.order = i);
        console.log(`[CV] Module reordered: ${evt.item.dataset.id} → position ${evt.newIndex}`);
        scheduleSave();
    }
});

// ── Delete Confirmation ──
const deleteConfirmOverlay = document.getElementById('delete-confirm-overlay');
const btnDeleteCancel = document.getElementById('btn-delete-cancel');
const btnDeleteConfirm = document.getElementById('btn-delete-confirm');
let pendingDeleteId = null;

function openDeleteConfirm(moduleId) {
    pendingDeleteId = moduleId;
    deleteConfirmOverlay.classList.add('open');
    deleteConfirmOverlay.setAttribute('aria-hidden', 'false');
}

function closeDeleteConfirm() {
    pendingDeleteId = null;
    deleteConfirmOverlay.classList.remove('open');
    deleteConfirmOverlay.setAttribute('aria-hidden', 'true');
}

function deleteModule(moduleId) {
    const el = moduleGrid.querySelector(`.module[data-id="${moduleId}"]`);
    if (el) {
        const bodyEl = el.querySelector('.module-body');
        if (bodyEl) moduleSizeObserver.unobserve(bodyEl);
        el.remove();
    }
    modules = modules.filter(m => m.id !== moduleId);
    modules.forEach((m, i) => m.order = i);
    updateEmptyState();
    console.log(`[CV] Module deleted: ${moduleId}`);
    scheduleSave();
}

btnDeleteCancel.addEventListener('click', closeDeleteConfirm);

btnDeleteConfirm.addEventListener('click', () => {
    if (pendingDeleteId) {
        deleteModule(pendingDeleteId);
    }
    closeDeleteConfirm();
});

// ── Edit/Play Mode Switching ──
function applyPlayMode() {
    closeOverflowMenu();
    document.querySelectorAll('.module').forEach(mod => {
        const type = mod.dataset.type;
        const data = modules.find(m => m.id === mod.dataset.id);
        if (type && MODULE_TYPES[type]?.onPlayMode) {
            MODULE_TYPES[type].onPlayMode(mod, data);
        }
        const handle = mod.querySelector('.module-drag-handle');
        if (handle) handle.style.display = 'none';
        const resizeHandle = mod.querySelector('.module-resize-handle');
        if (resizeHandle) resizeHandle.style.display = 'none';
        const copyBtn = mod.querySelector('.module-copy-btn');
        if (copyBtn) copyBtn.style.display = 'none';
        const rollableBtn = mod.querySelector('.module-rollable-btn');
        if (rollableBtn) rollableBtn.style.display = 'none';
        const addStatBtn = mod.querySelector('.module-addstat-btn');
        if (addStatBtn) addStatBtn.style.display = 'none';
        const swapLayoutBtn = mod.querySelector('.module-swaplayout-btn');
        if (swapLayoutBtn) swapLayoutBtn.style.display = 'none';
        const healthMaxModBtn = mod.querySelector('.module-health-maxmod-btn');
        if (healthMaxModBtn) healthMaxModBtn.style.display = 'none';
        const healthEyedropperBtn = mod.querySelector('.module-health-eyedropper-btn');
        if (healthEyedropperBtn) healthEyedropperBtn.style.display = 'none';
        const deleteBtn = mod.querySelector('.module-delete-btn');
        if (deleteBtn) deleteBtn.style.display = 'none';
        const overflowBtn = mod.querySelector('.module-overflow-btn');
        if (overflowBtn) overflowBtn.style.display = 'none';
        const themeBtn = mod.querySelector('.module-theme-btn');
        if (themeBtn) themeBtn.style.display = 'none';
        // Clear stat selection when entering play mode
        mod._selectedStatIndex = null;
        // Title: show label, hide input
        const titleInput = mod.querySelector('.module-title-input');
        const titleLabel = mod.querySelector('.module-type-label');
        if (titleInput && titleLabel) {
            const typeDef = MODULE_TYPES[type];
            titleLabel.textContent = data?.title || (typeDef ? t(typeDef.label) : '');
            titleLabel.style.display = '';
            titleInput.style.display = 'none';
        }
        // Re-snap auto-height after mode switch (play blocks are shorter)
        if (data) snapModuleHeight(mod, data);
    });
}

function applyEditMode() {
    document.querySelectorAll('.module').forEach(mod => {
        const type = mod.dataset.type;
        const data = modules.find(m => m.id === mod.dataset.id);
        if (type && MODULE_TYPES[type]?.onEditMode) {
            MODULE_TYPES[type].onEditMode(mod, data);
        }
        const handle = mod.querySelector('.module-drag-handle');
        if (handle) handle.style.display = '';
        const resizeHandle = mod.querySelector('.module-resize-handle');
        if (resizeHandle) resizeHandle.style.display = '';
        const copyBtn = mod.querySelector('.module-copy-btn');
        if (copyBtn) copyBtn.style.display = '';
        const rollableBtn = mod.querySelector('.module-rollable-btn');
        if (rollableBtn) { rollableBtn.style.display = ''; rollableBtn.classList.add('disabled'); rollableBtn.classList.remove('active'); }
        const addStatBtn = mod.querySelector('.module-addstat-btn');
        if (addStatBtn) addStatBtn.style.display = '';
        const swapLayoutBtn = mod.querySelector('.module-swaplayout-btn');
        if (swapLayoutBtn) swapLayoutBtn.style.display = '';
        const healthMaxModBtnEdit = mod.querySelector('.module-health-maxmod-btn');
        if (healthMaxModBtnEdit) healthMaxModBtnEdit.style.display = '';
        const healthEyedropperBtnEdit = mod.querySelector('.module-health-eyedropper-btn');
        if (healthEyedropperBtnEdit) healthEyedropperBtnEdit.style.display = '';
        // Clear stat selection when entering edit mode
        mod._selectedStatIndex = null;
        const deleteBtn = mod.querySelector('.module-delete-btn');
        if (deleteBtn) deleteBtn.style.display = '';
        const overflowBtnEdit = mod.querySelector('.module-overflow-btn');
        if (overflowBtnEdit) overflowBtnEdit.style.display = '';
        const themeBtnEdit = mod.querySelector('.module-theme-btn');
        if (themeBtnEdit) themeBtnEdit.style.display = '';
        // Title: show input, hide label
        const titleInput = mod.querySelector('.module-title-input');
        const titleLabel = mod.querySelector('.module-type-label');
        if (titleInput && titleLabel) {
            titleLabel.style.display = 'none';
            titleInput.style.display = '';
        }
        // Re-snap auto-height after mode switch (edit blocks are taller)
        if (data) snapModuleHeight(mod, data);
    });
}

// ── Module Size Constants ──
const GRID_COLUMNS = 4;
const GRID_GAP = 8;
const ROW_H = 80;

// ── Auto-Snap Height to Grid Rows ──
let _snapping = false;

function snapModuleHeight(el, data) {
    if (data.rowSpan !== null) return;
    if (data.type === 'hline') return;
    _snapping = true;
    // Temporarily clear any previously snapped height so we measure natural content height
    el.style.height = '';
    const actual = el.getBoundingClientRect().height;
    const snappedRows = Math.ceil((actual + GRID_GAP) / (ROW_H + GRID_GAP));
    const snappedPx = (snappedRows * ROW_H) + ((snappedRows - 1) * GRID_GAP);
    el.style.height = snappedPx + 'px';
    _snapping = false;
}

// ── ResizeObserver for Size Classes ──
const moduleSizeObserver = new ResizeObserver(entries => {
    if (_snapping) return; // avoid re-entrancy from snapModuleHeight
    for (const entry of entries) {
        const w = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        const mod = entry.target.closest('.module');
        if (!mod) continue;
        let size = 'lg';
        if (w < 100) size = 'xs';
        else if (w < 200) size = 'sm';
        else if (w < 350) size = 'md';
        mod.dataset.size = size;

        // Re-snap auto-height modules when body size changes
        const data = modules.find(m => m.id === mod.dataset.id);
        if (data && data.rowSpan === null) {
            snapModuleHeight(mod, data);
        }
    }
});

// ── Module Resize Handle ──

function initResizeHandle(moduleEl, data) {
    const handle = moduleEl.querySelector('.module-resize-handle');
    if (!handle) return;

    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Only allow resize in edit mode
        if (modeToggle.classList.contains('mode-play')) return;

        const grid = document.getElementById('module-grid');
        const gridRect = grid.getBoundingClientRect();
        const gridContentWidth = gridRect.width - (GRID_GAP * 2); // subtract padding
        const colWidth = (gridContentWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

        const startX = e.clientX;
        const startY = e.clientY;
        const startColSpan = data.colSpan;
        // When rowSpan is null (auto-height), derive from actual rendered height
        const startRowSpan = data.rowSpan || Math.max(1, Math.round((moduleEl.getBoundingClientRect().height + GRID_GAP) / (ROW_H + GRID_GAP)));

        // Fixed row height independent of column width
        const rowHeight = ROW_H;

        moduleEl.classList.add('module-resizing');
        handle.classList.add('resizing');

        // Create resize dimension badge
        let badge = moduleEl.querySelector('.module-resize-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'module-resize-badge';
            moduleEl.appendChild(badge);
        }
        badge.textContent = `${startColSpan} col × ${startRowSpan} row`;

        function onMouseMove(e) {
            // Calculate new colSpan from drag delta (avoids stale position after grid reflow)
            const deltaX = e.clientX - startX;
            const colDelta = Math.round(deltaX / (colWidth + GRID_GAP));
            let newColSpan = startColSpan + colDelta;
            newColSpan = Math.max(1, Math.min(GRID_COLUMNS, newColSpan));

            if (newColSpan !== data.colSpan) {
                data.colSpan = newColSpan;
                moduleEl.style.gridColumn = `span ${newColSpan}`;
            }

            // Calculate new rowSpan from drag delta (avoids stale moduleTop after grid reflow)
            const deltaY = e.clientY - startY;
            const rowDelta = Math.sign(deltaY) * Math.round(Math.abs(deltaY) / (rowHeight + GRID_GAP));
            let newRowSpan = startRowSpan + rowDelta;
            newRowSpan = Math.max(1, newRowSpan);

            // Convert row span to pixel height: (rowSpan * rowHeight) + ((rowSpan - 1) * gap)
            const newHeight = (newRowSpan * rowHeight) + ((newRowSpan - 1) * GRID_GAP);

            moduleEl.style.height = `${newHeight}px`;
            data.rowSpan = newRowSpan;

            // Update resize badge
            badge.textContent = `${data.colSpan} col × ${data.rowSpan} row`;
        }

        function onMouseUp() {
            moduleEl.classList.remove('module-resizing');
            handle.classList.remove('resizing');
            if (badge) badge.remove();
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            console.log(`[CV] Module resized: ${data.id} → ${data.colSpan} cols, ${data.rowSpan || '?'} rows`);
            scheduleSave();
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}
