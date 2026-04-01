// ── Condition Module ──
// Track character conditions with game-system templates, toggle/value types, and cascading sub-conditions.
(function () {
    'use strict';

    // ── ID Generation ──
    function generateCondId() {
        return 'cond_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // ── Content Shape Guard ──
    function ensureCondContent(data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = { template: 'custom', applied: [], staging: [], customConditions: [], sortBy: null, sortDir: 'asc' };
        }
        if (!data.content.template) data.content.template = 'custom';
        if (!Array.isArray(data.content.applied)) data.content.applied = [];
        if (!Array.isArray(data.content.staging)) data.content.staging = [];
        if (!Array.isArray(data.content.customConditions)) data.content.customConditions = [];
        if (data.content.sortBy === undefined) data.content.sortBy = null;
        if (!data.content.sortDir) data.content.sortDir = 'asc';
        return data.content;
    }

    // ── Condition Icon SVGs ──
    var CONDITION_ICON_SVG = {
        'eye-off': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
        'heart': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>',
        'ear-off': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18.5a3.5 3.5 0 0 1-3.5-3.5V12a9 9 0 0 1 9-9 8.94 8.94 0 0 1 3.42.67"/><path d="M20 12a8.94 8.94 0 0 0-.67-3.42"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
        'zap-off': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="12.41 6.75 13 2 10.57 4.92"/><polyline points="18.57 12.91 21 10 15.66 10"/><polyline points="8 8 3 14 12 14 11 22 16 16"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
        'ghost': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2 2 3-3 3 3 2-2 3 3V10a8 8 0 0 0-8-8z"/></svg>',
        'grab': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v1"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>',
        'lock': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
        'eye': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
        'shield': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        'gem': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 18 3 22 9 12 22 2 9"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="22" x2="6" y2="9"/><line x1="12" y1="22" x2="18" y2="9"/></svg>',
        'skull': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="8"/><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none"/><path d="M8 16v6h2v-2h4v2h2v-6"/></svg>',
        'arrow-down': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
        'chain': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
        'star': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        'moon': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
        'brain': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 3 1.5 5 3 6.5V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3.5c1.5-1.5 3-3.5 3-6.5a8 8 0 0 0-8-8z"/><path d="M8 12c1-1 2-2 4-2s3 1 4 2"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
        'flame': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 3 5 6 5 11a5 5 0 0 1-10 0c0-5 4-8 5-11z"/></svg>',
        'droplet': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
        'target': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
        'alert': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        'sword': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="2" x2="9" y2="11"/><line x1="22" y1="2" x2="18" y2="2"/><line x1="22" y1="6" x2="22" y2="2"/><line x1="7" y1="13" x2="2" y2="18"/><line x1="5" y1="16" x2="8" y2="19"/><line x1="2" y1="22" x2="4" y2="20"/></svg>',
        'wind': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2"/><path d="M12.59 19.41A2 2 0 1 0 14 16H2"/><path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2"/></svg>',
        'thermometer': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
        'radioactive': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 4.5A7.5 7.5 0 0 1 19.5 12h-3a4.5 4.5 0 0 0-4.5-4.5v-3z"/><path d="M12 4.5A7.5 7.5 0 0 0 4.5 12h3a4.5 4.5 0 0 1 4.5-4.5v-3z"/><path d="M4.5 12A7.5 7.5 0 0 0 12 19.5v-3A4.5 4.5 0 0 1 7.5 12h-3z"/><path d="M19.5 12A7.5 7.5 0 0 1 12 19.5v-3a4.5 4.5 0 0 0 4.5-4.5h3z"/></svg>',
        'syringe': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2l4 4"/><path d="M17 7l-10 10"/><path d="M9 12l-5 5"/><path d="M2 22l4-4"/><path d="M15 5l4 4"/></svg>',
        'crosshair': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>',
        'shield-off': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="4" y1="4" x2="20" y2="20"/></svg>',
        'cloud': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
        'x-circle': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        'zap': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 2 4 14 12 14 11 22 20 10 12 10 13 2"/></svg>',
        'activity': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        'anchor': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>',
        'slash': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
        'clock': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        'frown': '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>'
    };

    // ── Condition Templates ──
    var CONDITION_TEMPLATES = {
        dnd5e: {
            nameKey: 'cond.templateDnd5e',
            conditions: [
                { key: 'dnd5e_blinded', nameKey: 'cond.dnd5e.blinded', icon: 'eye-off', type: 'toggle', descKey: 'cond.dnd5e.blindedDesc', maxValue: null, subconditions: [] },
                { key: 'dnd5e_charmed', nameKey: 'cond.dnd5e.charmed', icon: 'heart', type: 'toggle', descKey: 'cond.dnd5e.charmedDesc', maxValue: null, subconditions: [] },
                { key: 'dnd5e_deafened', nameKey: 'cond.dnd5e.deafened', icon: 'ear-off', type: 'toggle', descKey: 'cond.dnd5e.deafenedDesc', maxValue: null, subconditions: [] },
                { key: 'dnd5e_exhaustion', nameKey: 'cond.dnd5e.exhaustion', icon: 'zap-off', type: 'value', descKey: 'cond.dnd5e.exhaustionDesc', maxValue: 6, subconditions: [] },
                { key: 'dnd5e_frightened', nameKey: 'cond.dnd5e.frightened', icon: 'ghost', type: 'toggle', descKey: 'cond.dnd5e.frightenedDesc', maxValue: null, subconditions: [] },
                { key: 'dnd5e_grappled', nameKey: 'cond.dnd5e.grappled', icon: 'grab', type: 'toggle', descKey: 'cond.dnd5e.grappledDesc', maxValue: null, subconditions: [] },
                { key: 'dnd5e_incapacitated', nameKey: 'cond.dnd5e.incapacitated', icon: 'lock', type: 'toggle', descKey: 'cond.dnd5e.incapacitatedDesc', maxValue: null, subconditions: [] },
                { key: 'dnd5e_invisible', nameKey: 'cond.dnd5e.invisible', icon: 'eye', type: 'toggle', descKey: 'cond.dnd5e.invisibleDesc', maxValue: null, subconditions: [] },
                { key: 'dnd5e_paralyzed', nameKey: 'cond.dnd5e.paralyzed', icon: 'shield', type: 'toggle', descKey: 'cond.dnd5e.paralyzedDesc', maxValue: null, subconditions: ['dnd5e_incapacitated'] },
                { key: 'dnd5e_petrified', nameKey: 'cond.dnd5e.petrified', icon: 'gem', type: 'toggle', descKey: 'cond.dnd5e.petrifiedDesc', maxValue: null, subconditions: ['dnd5e_incapacitated'] },
                { key: 'dnd5e_poisoned', nameKey: 'cond.dnd5e.poisoned', icon: 'skull', type: 'toggle', descKey: 'cond.dnd5e.poisonedDesc', maxValue: null, subconditions: [] },
                { key: 'dnd5e_prone', nameKey: 'cond.dnd5e.prone', icon: 'arrow-down', type: 'toggle', descKey: 'cond.dnd5e.proneDesc', maxValue: null, subconditions: [] },
                { key: 'dnd5e_restrained', nameKey: 'cond.dnd5e.restrained', icon: 'chain', type: 'toggle', descKey: 'cond.dnd5e.restrainedDesc', maxValue: null, subconditions: [] },
                { key: 'dnd5e_stunned', nameKey: 'cond.dnd5e.stunned', icon: 'star', type: 'toggle', descKey: 'cond.dnd5e.stunnedDesc', maxValue: null, subconditions: ['dnd5e_incapacitated'] },
                { key: 'dnd5e_unconscious', nameKey: 'cond.dnd5e.unconscious', icon: 'moon', type: 'toggle', descKey: 'cond.dnd5e.unconsciousDesc', maxValue: null, subconditions: ['dnd5e_incapacitated', 'dnd5e_prone'] }
            ]
        },
        pf2e: {
            nameKey: 'cond.templatePf2e',
            conditions: [
                { key: 'pf2e_blinded', nameKey: 'cond.pf2e.blinded', icon: 'eye-off', type: 'toggle', descKey: 'cond.pf2e.blindedDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_clumsy', nameKey: 'cond.pf2e.clumsy', icon: 'frown', type: 'value', descKey: 'cond.pf2e.clumsyDesc', maxValue: 4, subconditions: [] },
                { key: 'pf2e_concealed', nameKey: 'cond.pf2e.concealed', icon: 'cloud', type: 'toggle', descKey: 'cond.pf2e.concealedDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_confused', nameKey: 'cond.pf2e.confused', icon: 'brain', type: 'toggle', descKey: 'cond.pf2e.confusedDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_controlled', nameKey: 'cond.pf2e.controlled', icon: 'anchor', type: 'toggle', descKey: 'cond.pf2e.controlledDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_dazzled', nameKey: 'cond.pf2e.dazzled', icon: 'star', type: 'toggle', descKey: 'cond.pf2e.dazzledDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_deafened', nameKey: 'cond.pf2e.deafened', icon: 'ear-off', type: 'toggle', descKey: 'cond.pf2e.deafenedDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_dying', nameKey: 'cond.pf2e.dying', icon: 'x-circle', type: 'value', descKey: 'cond.pf2e.dyingDesc', maxValue: 4, subconditions: ['pf2e_unconscious'] },
                { key: 'pf2e_fascinated', nameKey: 'cond.pf2e.fascinated', icon: 'heart', type: 'toggle', descKey: 'cond.pf2e.fascinatedDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_fatigued', nameKey: 'cond.pf2e.fatigued', icon: 'zap-off', type: 'toggle', descKey: 'cond.pf2e.fatiguedDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_fleeing', nameKey: 'cond.pf2e.fleeing', icon: 'ghost', type: 'toggle', descKey: 'cond.pf2e.fleeingDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_grabbed', nameKey: 'cond.pf2e.grabbed', icon: 'grab', type: 'toggle', descKey: 'cond.pf2e.grabbedDesc', maxValue: null, subconditions: ['pf2e_offguard', 'pf2e_immobilized'] },
                { key: 'pf2e_hidden', nameKey: 'cond.pf2e.hidden', icon: 'eye', type: 'toggle', descKey: 'cond.pf2e.hiddenDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_offguard', nameKey: 'cond.pf2e.offguard', icon: 'shield-off', type: 'toggle', descKey: 'cond.pf2e.offguardDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_immobilized', nameKey: 'cond.pf2e.immobilized', icon: 'anchor', type: 'toggle', descKey: 'cond.pf2e.immobilizedDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_impaired', nameKey: 'cond.pf2e.impaired', icon: 'slash', type: 'toggle', descKey: 'cond.pf2e.impairedDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_invisible', nameKey: 'cond.pf2e.invisible', icon: 'eye', type: 'toggle', descKey: 'cond.pf2e.invisibleDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_paralyzed', nameKey: 'cond.pf2e.paralyzed', icon: 'shield', type: 'toggle', descKey: 'cond.pf2e.paralyzedDesc', maxValue: null, subconditions: ['pf2e_offguard', 'pf2e_immobilized', 'pf2e_incapacitated'] },
                { key: 'pf2e_incapacitated', nameKey: 'cond.pf2e.incapacitated', icon: 'lock', type: 'toggle', descKey: 'cond.pf2e.incapacitatedDesc', maxValue: null, subconditions: [] },
                { key: 'pf2e_petrified', nameKey: 'cond.pf2e.petrified', icon: 'gem', type: 'toggle', descKey: 'cond.pf2e.petrifiedDesc', maxValue: null, subconditions: ['pf2e_offguard', 'pf2e_immobilized', 'pf2e_incapacitated'] },
                { key: 'pf2e_prone', nameKey: 'cond.pf2e.prone', icon: 'arrow-down', type: 'toggle', descKey: 'cond.pf2e.proneDesc', maxValue: null, subconditions: ['pf2e_offguard'] },
                { key: 'pf2e_restrained', nameKey: 'cond.pf2e.restrained', icon: 'chain', type: 'toggle', descKey: 'cond.pf2e.restrainedDesc', maxValue: null, subconditions: ['pf2e_offguard', 'pf2e_immobilized', 'pf2e_incapacitated'] },
                { key: 'pf2e_sickened', nameKey: 'cond.pf2e.sickened', icon: 'frown', type: 'value', descKey: 'cond.pf2e.sickenedDesc', maxValue: 4, subconditions: [] },
                { key: 'pf2e_slowed', nameKey: 'cond.pf2e.slowed', icon: 'clock', type: 'value', descKey: 'cond.pf2e.slowedDesc', maxValue: 4, subconditions: [] },
                { key: 'pf2e_stunned', nameKey: 'cond.pf2e.stunned', icon: 'star', type: 'value', descKey: 'cond.pf2e.stunnedDesc', maxValue: 4, subconditions: [] },
                { key: 'pf2e_stupefied', nameKey: 'cond.pf2e.stupefied', icon: 'brain', type: 'value', descKey: 'cond.pf2e.stupefiedDesc', maxValue: 4, subconditions: [] },
                { key: 'pf2e_unconscious', nameKey: 'cond.pf2e.unconscious', icon: 'moon', type: 'toggle', descKey: 'cond.pf2e.unconsciousDesc', maxValue: null, subconditions: ['pf2e_offguard', 'pf2e_blinded', 'pf2e_prone'] }
            ]
        },
        coc: {
            nameKey: 'cond.templateCoc',
            conditions: [
                { key: 'coc_majorwound', nameKey: 'cond.coc.majorwound', icon: 'activity', type: 'toggle', descKey: 'cond.coc.majorwoundDesc', maxValue: null, subconditions: ['coc_prone'] },
                { key: 'coc_unconscious', nameKey: 'cond.coc.unconscious', icon: 'moon', type: 'toggle', descKey: 'cond.coc.unconsciousDesc', maxValue: null, subconditions: ['coc_prone'] },
                { key: 'coc_dying', nameKey: 'cond.coc.dying', icon: 'x-circle', type: 'toggle', descKey: 'cond.coc.dyingDesc', maxValue: null, subconditions: ['coc_unconscious'] },
                { key: 'coc_prone', nameKey: 'cond.coc.prone', icon: 'arrow-down', type: 'toggle', descKey: 'cond.coc.proneDesc', maxValue: null, subconditions: [] },
                { key: 'coc_incapacitated', nameKey: 'cond.coc.incapacitated', icon: 'lock', type: 'toggle', descKey: 'cond.coc.incapacitatedDesc', maxValue: null, subconditions: [] },
                { key: 'coc_boutofmadness', nameKey: 'cond.coc.boutofmadness', icon: 'brain', type: 'toggle', descKey: 'cond.coc.boutofmadnessDesc', maxValue: null, subconditions: [] },
                { key: 'coc_tempinsanity', nameKey: 'cond.coc.tempinsanity', icon: 'brain', type: 'toggle', descKey: 'cond.coc.tempinsanityDesc', maxValue: null, subconditions: [] },
                { key: 'coc_indefinsanity', nameKey: 'cond.coc.indefinsanity', icon: 'brain', type: 'toggle', descKey: 'cond.coc.indefinsanityDesc', maxValue: null, subconditions: [] },
                { key: 'coc_perminsane', nameKey: 'cond.coc.perminsane', icon: 'brain', type: 'toggle', descKey: 'cond.coc.perminsaneDesc', maxValue: null, subconditions: [] },
                { key: 'coc_amnesia', nameKey: 'cond.coc.amnesia', icon: 'cloud', type: 'toggle', descKey: 'cond.coc.amnesiaDesc', maxValue: null, subconditions: [] },
                { key: 'coc_phobia', nameKey: 'cond.coc.phobia', icon: 'ghost', type: 'toggle', descKey: 'cond.coc.phobiaDesc', maxValue: null, subconditions: [] },
                { key: 'coc_mania', nameKey: 'cond.coc.mania', icon: 'zap', type: 'toggle', descKey: 'cond.coc.maniaDesc', maxValue: null, subconditions: [] },
                { key: 'coc_paranoia', nameKey: 'cond.coc.paranoia', icon: 'eye', type: 'toggle', descKey: 'cond.coc.paranoiaDesc', maxValue: null, subconditions: [] }
            ]
        },
        vtm: {
            nameKey: 'cond.templateVtm',
            conditions: [
                { key: 'vtm_hunger', nameKey: 'cond.vtm.hunger', icon: 'droplet', type: 'value', descKey: 'cond.vtm.hungerDesc', maxValue: 5, subconditions: [] },
                { key: 'vtm_impaired', nameKey: 'cond.vtm.impaired', icon: 'slash', type: 'toggle', descKey: 'cond.vtm.impairedDesc', maxValue: null, subconditions: [] },
                { key: 'vtm_bloodbound', nameKey: 'cond.vtm.bloodbound', icon: 'chain', type: 'toggle', descKey: 'cond.vtm.bloodboundDesc', maxValue: null, subconditions: [] },
                { key: 'vtm_frenzy', nameKey: 'cond.vtm.frenzy', icon: 'flame', type: 'toggle', descKey: 'cond.vtm.frenzyDesc', maxValue: null, subconditions: [] },
                { key: 'vtm_rotschreck', nameKey: 'cond.vtm.rotschreck', icon: 'ghost', type: 'toggle', descKey: 'cond.vtm.rotschreckDesc', maxValue: null, subconditions: [] },
                { key: 'vtm_torpor', nameKey: 'cond.vtm.torpor', icon: 'moon', type: 'toggle', descKey: 'cond.vtm.torporDesc', maxValue: null, subconditions: ['vtm_incapacitated'] },
                { key: 'vtm_incapacitated', nameKey: 'cond.vtm.incapacitated', icon: 'lock', type: 'toggle', descKey: 'cond.vtm.incapacitatedDesc', maxValue: null, subconditions: ['vtm_impaired'] },
                { key: 'vtm_finaldeath', nameKey: 'cond.vtm.finaldeath', icon: 'skull', type: 'toggle', descKey: 'cond.vtm.finaldeathDesc', maxValue: null, subconditions: ['vtm_incapacitated'] },
                { key: 'vtm_compulsion', nameKey: 'cond.vtm.compulsion', icon: 'brain', type: 'toggle', descKey: 'cond.vtm.compulsionDesc', maxValue: null, subconditions: [] },
                { key: 'vtm_messycritical', nameKey: 'cond.vtm.messycritical', icon: 'alert', type: 'toggle', descKey: 'cond.vtm.messycriticalDesc', maxValue: null, subconditions: ['vtm_compulsion'] },
                { key: 'vtm_bestialfailure', nameKey: 'cond.vtm.bestialfailure', icon: 'alert', type: 'toggle', descKey: 'cond.vtm.bestialfailureDesc', maxValue: null, subconditions: ['vtm_compulsion'] },
                { key: 'vtm_stains', nameKey: 'cond.vtm.stains', icon: 'droplet', type: 'value', descKey: 'cond.vtm.stainsDesc', maxValue: 10, subconditions: [] }
            ]
        },
        cpred: {
            nameKey: 'cond.templateCpred',
            conditions: [
                // Base conditions
                { key: 'cpred_blinded', nameKey: 'cond.cpred.blinded', icon: 'eye-off', type: 'toggle', descKey: 'cond.cpred.blindedDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_deafened', nameKey: 'cond.cpred.deafened', icon: 'ear-off', type: 'toggle', descKey: 'cond.cpred.deafenedDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_grabbed', nameKey: 'cond.cpred.grabbed', icon: 'grab', type: 'toggle', descKey: 'cond.cpred.grabbedDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_onfire', nameKey: 'cond.cpred.onfire', icon: 'flame', type: 'toggle', descKey: 'cond.cpred.onfireDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_poisoned', nameKey: 'cond.cpred.poisoned', icon: 'skull', type: 'toggle', descKey: 'cond.cpred.poisonedDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_prone', nameKey: 'cond.cpred.prone', icon: 'arrow-down', type: 'toggle', descKey: 'cond.cpred.proneDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_restrained', nameKey: 'cond.cpred.restrained', icon: 'chain', type: 'toggle', descKey: 'cond.cpred.restrainedDesc', maxValue: null, subconditions: ['cpred_grabbed'] },
                { key: 'cpred_stunned', nameKey: 'cond.cpred.stunned', icon: 'star', type: 'toggle', descKey: 'cond.cpred.stunnedDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_unconscious', nameKey: 'cond.cpred.unconscious', icon: 'moon', type: 'toggle', descKey: 'cond.cpred.unconsciousDesc', maxValue: null, subconditions: ['cpred_prone'] },
                { key: 'cpred_dying', nameKey: 'cond.cpred.dying', icon: 'x-circle', type: 'toggle', descKey: 'cond.cpred.dyingDesc', maxValue: null, subconditions: ['cpred_unconscious'] },
                // Critical Injuries — Head
                { key: 'cpred_braininjury', nameKey: 'cond.cpred.braininjury', icon: 'brain', type: 'toggle', descKey: 'cond.cpred.braininjuryDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_brokenjaw', nameKey: 'cond.cpred.brokenjaw', icon: 'alert', type: 'toggle', descKey: 'cond.cpred.brokenjawDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_concussion', nameKey: 'cond.cpred.concussion', icon: 'brain', type: 'toggle', descKey: 'cond.cpred.concussionDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_crackedskull', nameKey: 'cond.cpred.crackedskull', icon: 'skull', type: 'toggle', descKey: 'cond.cpred.crackedskullDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_crushedwindpipe', nameKey: 'cond.cpred.crushedwindpipe', icon: 'alert', type: 'toggle', descKey: 'cond.cpred.crushedwindpipeDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_damagedeye', nameKey: 'cond.cpred.damagedeye', icon: 'eye-off', type: 'toggle', descKey: 'cond.cpred.damagedeyeDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_damagedear', nameKey: 'cond.cpred.damagedear', icon: 'ear-off', type: 'toggle', descKey: 'cond.cpred.damagedearDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_destroyedeye', nameKey: 'cond.cpred.destroyedeye', icon: 'eye-off', type: 'toggle', descKey: 'cond.cpred.destroyedeyeDesc', maxValue: null, subconditions: ['cpred_blinded'] },
                { key: 'cpred_lostear', nameKey: 'cond.cpred.lostear', icon: 'ear-off', type: 'toggle', descKey: 'cond.cpred.lostearDesc', maxValue: null, subconditions: ['cpred_deafened'] },
                { key: 'cpred_shatteredjaw', nameKey: 'cond.cpred.shatteredjaw', icon: 'alert', type: 'toggle', descKey: 'cond.cpred.shatteredjawDesc', maxValue: null, subconditions: [] },
                // Critical Injuries — Body
                { key: 'cpred_brokenarm', nameKey: 'cond.cpred.brokenarm', icon: 'sword', type: 'toggle', descKey: 'cond.cpred.brokenarmDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_brokenleg', nameKey: 'cond.cpred.brokenleg', icon: 'sword', type: 'toggle', descKey: 'cond.cpred.brokenlegDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_brokenribs', nameKey: 'cond.cpred.brokenribs', icon: 'sword', type: 'toggle', descKey: 'cond.cpred.brokenribsDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_collapsedlung', nameKey: 'cond.cpred.collapsedlung', icon: 'wind', type: 'toggle', descKey: 'cond.cpred.collapsedlungDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_crushedfingers', nameKey: 'cond.cpred.crushedfingers', icon: 'grab', type: 'toggle', descKey: 'cond.cpred.crushedfingersDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_dislocshoulder', nameKey: 'cond.cpred.dislocshoulder', icon: 'sword', type: 'toggle', descKey: 'cond.cpred.dislocshoulderDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_dismemberedarm', nameKey: 'cond.cpred.dismemberedarm', icon: 'sword', type: 'toggle', descKey: 'cond.cpred.dismemberedarmDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_dismemberedhand', nameKey: 'cond.cpred.dismemberedhand', icon: 'grab', type: 'toggle', descKey: 'cond.cpred.dismemberedhandDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_dismemberedleg', nameKey: 'cond.cpred.dismemberedleg', icon: 'sword', type: 'toggle', descKey: 'cond.cpred.dismemberedlegDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_foreignobject', nameKey: 'cond.cpred.foreignobject', icon: 'alert', type: 'toggle', descKey: 'cond.cpred.foreignobjectDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_spinalinjury', nameKey: 'cond.cpred.spinalinjury', icon: 'alert', type: 'toggle', descKey: 'cond.cpred.spinalinjuryDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_suckingchest', nameKey: 'cond.cpred.suckingchest', icon: 'wind', type: 'toggle', descKey: 'cond.cpred.suckingchestDesc', maxValue: null, subconditions: [] },
                { key: 'cpred_tornmuscle', nameKey: 'cond.cpred.tornmuscle', icon: 'sword', type: 'toggle', descKey: 'cond.cpred.tornmuscleDesc', maxValue: null, subconditions: [] }
            ]
        },
        mothership: {
            nameKey: 'cond.templateMothership',
            conditions: [
                // General
                { key: 'moth_stress', nameKey: 'cond.moth.stress', icon: 'activity', type: 'value', descKey: 'cond.moth.stressDesc', maxValue: 20, subconditions: [] },
                { key: 'moth_wounded', nameKey: 'cond.moth.wounded', icon: 'droplet', type: 'value', descKey: 'cond.moth.woundedDesc', maxValue: null, subconditions: [] },
                { key: 'moth_unconscious', nameKey: 'cond.moth.unconscious', icon: 'moon', type: 'toggle', descKey: 'cond.moth.unconsciousDesc', maxValue: null, subconditions: [] },
                { key: 'moth_panicked', nameKey: 'cond.moth.panicked', icon: 'alert', type: 'toggle', descKey: 'cond.moth.panickedDesc', maxValue: null, subconditions: [] },
                // Panic Results
                { key: 'moth_adrenalinerush', nameKey: 'cond.moth.adrenalinerush', icon: 'zap', type: 'toggle', descKey: 'cond.moth.adrenalinerushDesc', maxValue: null, subconditions: [] },
                { key: 'moth_anxious', nameKey: 'cond.moth.anxious', icon: 'frown', type: 'toggle', descKey: 'cond.moth.anxiousDesc', maxValue: null, subconditions: [] },
                { key: 'moth_overwhelmed', nameKey: 'cond.moth.overwhelmed', icon: 'cloud', type: 'toggle', descKey: 'cond.moth.overwhelmedDesc', maxValue: null, subconditions: [] },
                { key: 'moth_cowardice', nameKey: 'cond.moth.cowardice', icon: 'ghost', type: 'toggle', descKey: 'cond.moth.cowardiceDesc', maxValue: null, subconditions: [] },
                { key: 'moth_hallucinations', nameKey: 'cond.moth.hallucinations', icon: 'eye', type: 'toggle', descKey: 'cond.moth.hallucinationsDesc', maxValue: null, subconditions: [] },
                { key: 'moth_phobia', nameKey: 'cond.moth.phobia', icon: 'ghost', type: 'toggle', descKey: 'cond.moth.phobiaDesc', maxValue: null, subconditions: [] },
                { key: 'moth_nightmares', nameKey: 'cond.moth.nightmares', icon: 'moon', type: 'toggle', descKey: 'cond.moth.nightmaresDesc', maxValue: null, subconditions: [] },
                { key: 'moth_lossconfidence', nameKey: 'cond.moth.lossconfidence', icon: 'frown', type: 'toggle', descKey: 'cond.moth.lossconfidenceDesc', maxValue: null, subconditions: [] },
                { key: 'moth_paranoid', nameKey: 'cond.moth.paranoid', icon: 'eye', type: 'toggle', descKey: 'cond.moth.paranoidDesc', maxValue: null, subconditions: [] },
                { key: 'moth_catatonic', nameKey: 'cond.moth.catatonic', icon: 'lock', type: 'toggle', descKey: 'cond.moth.catatonicDesc', maxValue: null, subconditions: ['moth_unconscious'] },
                { key: 'moth_rage', nameKey: 'cond.moth.rage', icon: 'flame', type: 'toggle', descKey: 'cond.moth.rageDesc', maxValue: null, subconditions: [] },
                { key: 'moth_spiraling', nameKey: 'cond.moth.spiraling', icon: 'activity', type: 'toggle', descKey: 'cond.moth.spiralingDesc', maxValue: null, subconditions: [] },
                // Wounds
                { key: 'moth_bleeding', nameKey: 'cond.moth.bleeding', icon: 'droplet', type: 'toggle', descKey: 'cond.moth.bleedingDesc', maxValue: null, subconditions: [] },
                { key: 'moth_broken', nameKey: 'cond.moth.broken', icon: 'sword', type: 'toggle', descKey: 'cond.moth.brokenDesc', maxValue: null, subconditions: [] },
                { key: 'moth_concussed', nameKey: 'cond.moth.concussed', icon: 'brain', type: 'toggle', descKey: 'cond.moth.concussedDesc', maxValue: null, subconditions: [] },
                // Environmental
                { key: 'moth_exhausted', nameKey: 'cond.moth.exhausted', icon: 'zap-off', type: 'toggle', descKey: 'cond.moth.exhaustedDesc', maxValue: null, subconditions: [] },
                { key: 'moth_cryosick', nameKey: 'cond.moth.cryosick', icon: 'thermometer', type: 'toggle', descKey: 'cond.moth.cryosickDesc', maxValue: null, subconditions: [] },
                { key: 'moth_addicted', nameKey: 'cond.moth.addicted', icon: 'syringe', type: 'toggle', descKey: 'cond.moth.addictedDesc', maxValue: null, subconditions: [] },
                { key: 'moth_irradiated', nameKey: 'cond.moth.irradiated', icon: 'radioactive', type: 'toggle', descKey: 'cond.moth.irradiatedDesc', maxValue: null, subconditions: [] }
            ]
        },
        sr6: {
            nameKey: 'cond.templateSr6',
            conditions: [
                { key: 'sr6_blinded', nameKey: 'cond.sr6.blinded', icon: 'eye-off', type: 'toggle', descKey: 'cond.sr6.blindedDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_burning', nameKey: 'cond.sr6.burning', icon: 'flame', type: 'toggle', descKey: 'cond.sr6.burningDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_chilled', nameKey: 'cond.sr6.chilled', icon: 'thermometer', type: 'toggle', descKey: 'cond.sr6.chilledDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_confused', nameKey: 'cond.sr6.confused', icon: 'brain', type: 'toggle', descKey: 'cond.sr6.confusedDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_corrosive', nameKey: 'cond.sr6.corrosive', icon: 'droplet', type: 'toggle', descKey: 'cond.sr6.corrosiveDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_dazed', nameKey: 'cond.sr6.dazed', icon: 'star', type: 'toggle', descKey: 'cond.sr6.dazedDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_deafened', nameKey: 'cond.sr6.deafened', icon: 'ear-off', type: 'toggle', descKey: 'cond.sr6.deafenedDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_fatigued', nameKey: 'cond.sr6.fatigued', icon: 'zap-off', type: 'toggle', descKey: 'cond.sr6.fatiguedDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_frightened', nameKey: 'cond.sr6.frightened', icon: 'ghost', type: 'toggle', descKey: 'cond.sr6.frightenedDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_heightened', nameKey: 'cond.sr6.heightened', icon: 'zap', type: 'toggle', descKey: 'cond.sr6.heightenedDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_immobilized', nameKey: 'cond.sr6.immobilized', icon: 'anchor', type: 'toggle', descKey: 'cond.sr6.immobilizedDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_invisible', nameKey: 'cond.sr6.invisible', icon: 'eye', type: 'toggle', descKey: 'cond.sr6.invisibleDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_nauseated', nameKey: 'cond.sr6.nauseated', icon: 'frown', type: 'toggle', descKey: 'cond.sr6.nauseatedDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_panicked', nameKey: 'cond.sr6.panicked', icon: 'alert', type: 'toggle', descKey: 'cond.sr6.panickedDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_paralyzed', nameKey: 'cond.sr6.paralyzed', icon: 'shield', type: 'toggle', descKey: 'cond.sr6.paralyzedDesc', maxValue: null, subconditions: ['sr6_immobilized'] },
                { key: 'sr6_petrified', nameKey: 'cond.sr6.petrified', icon: 'gem', type: 'toggle', descKey: 'cond.sr6.petrifiedDesc', maxValue: null, subconditions: ['sr6_immobilized'] },
                { key: 'sr6_poisoned', nameKey: 'cond.sr6.poisoned', icon: 'skull', type: 'toggle', descKey: 'cond.sr6.poisonedDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_prone', nameKey: 'cond.sr6.prone', icon: 'arrow-down', type: 'toggle', descKey: 'cond.sr6.proneDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_silent', nameKey: 'cond.sr6.silent', icon: 'slash', type: 'toggle', descKey: 'cond.sr6.silentDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_stunned', nameKey: 'cond.sr6.stunned', icon: 'star', type: 'toggle', descKey: 'cond.sr6.stunnedDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_unconscious', nameKey: 'cond.sr6.unconscious', icon: 'moon', type: 'toggle', descKey: 'cond.sr6.unconsciousDesc', maxValue: null, subconditions: ['sr6_prone'] },
                { key: 'sr6_wet', nameKey: 'cond.sr6.wet', icon: 'droplet', type: 'toggle', descKey: 'cond.sr6.wetDesc', maxValue: null, subconditions: [] },
                { key: 'sr6_zapped', nameKey: 'cond.sr6.zapped', icon: 'zap', type: 'toggle', descKey: 'cond.sr6.zappedDesc', maxValue: null, subconditions: [] }
            ]
        },
        daggerheart: {
            nameKey: 'cond.templateDaggerheart',
            conditions: [
                { key: 'dh_bleeding', nameKey: 'cond.dh.bleeding', icon: 'droplet', type: 'toggle', descKey: 'cond.dh.bleedingDesc', maxValue: null, subconditions: [] },
                { key: 'dh_fearful', nameKey: 'cond.dh.fearful', icon: 'ghost', type: 'toggle', descKey: 'cond.dh.fearfulDesc', maxValue: null, subconditions: [] },
                { key: 'dh_hidden', nameKey: 'cond.dh.hidden', icon: 'eye', type: 'toggle', descKey: 'cond.dh.hiddenDesc', maxValue: null, subconditions: [] },
                { key: 'dh_marked', nameKey: 'cond.dh.marked', icon: 'target', type: 'toggle', descKey: 'cond.dh.markedDesc', maxValue: null, subconditions: [] },
                { key: 'dh_poisoned', nameKey: 'cond.dh.poisoned', icon: 'skull', type: 'toggle', descKey: 'cond.dh.poisonedDesc', maxValue: null, subconditions: [] },
                { key: 'dh_restrained', nameKey: 'cond.dh.restrained', icon: 'chain', type: 'toggle', descKey: 'cond.dh.restrainedDesc', maxValue: null, subconditions: [] },
                { key: 'dh_stunned', nameKey: 'cond.dh.stunned', icon: 'star', type: 'toggle', descKey: 'cond.dh.stunnedDesc', maxValue: null, subconditions: ['dh_restrained'] },
                { key: 'dh_vulnerable', nameKey: 'cond.dh.vulnerable', icon: 'crosshair', type: 'toggle', descKey: 'cond.dh.vulnerableDesc', maxValue: null, subconditions: [] }
            ]
        },
        custom: {
            nameKey: 'cond.templateCustom',
            conditions: []
        }
    };

    var TEMPLATE_KEYS = ['dnd5e', 'pf2e', 'coc', 'vtm', 'cpred', 'mothership', 'sr6', 'daggerheart', 'custom'];

    // ── Helpers ──

    function getTemplateDef(typeKey, templateKey) {
        var tpl = CONDITION_TEMPLATES[templateKey];
        if (!tpl) return null;
        return tpl.conditions.find(function (c) { return c.key === typeKey; }) || null;
    }

    function getCondName(item, content) {
        // Check template first
        var def = getTemplateDef(item.typeKey, content.template);
        if (def) return t(def.nameKey);
        // Check custom conditions
        var custom = (content.customConditions || []).find(function (c) { return c.key === item.typeKey; });
        if (custom) return custom.name;
        return item.typeKey || '?';
    }

    function getCondIconSvg(item, content) {
        // Check template definition
        var def = getTemplateDef(item.typeKey, content.template);
        if (def && def.icon && CONDITION_ICON_SVG[def.icon]) return CONDITION_ICON_SVG[def.icon];
        // Check custom
        var custom = (content.customConditions || []).find(function (c) { return c.key === item.typeKey; });
        if (custom && custom.icon && CONDITION_ICON_SVG[custom.icon]) return CONDITION_ICON_SVG[custom.icon];
        // Fallback
        return CONDITION_ICON_SVG['alert'] || '';
    }

    function getCondDescription(item, content) {
        if (item.description) return item.description;
        var def = getTemplateDef(item.typeKey, content.template);
        if (def && def.descKey) return t(def.descKey);
        var custom = (content.customConditions || []).find(function (c) { return c.key === item.typeKey; });
        if (custom && custom.description) return custom.description;
        return '';
    }

    function getCondType(item, content) {
        if (item.type) return item.type;
        var def = getTemplateDef(item.typeKey, content.template);
        if (def) return def.type;
        return 'toggle';
    }

    function getCondMaxValue(item, content) {
        if (item.maxValue !== null && item.maxValue !== undefined) return item.maxValue;
        var def = getTemplateDef(item.typeKey, content.template);
        if (def) return def.maxValue;
        return null;
    }

    function sortAppliedList(applied, content) {
        if (!content.sortBy) return; // custom order — no auto-sort
        var dir = content.sortDir === 'desc' ? -1 : 1;
        if (content.sortBy === 'alpha') {
            applied.sort(function (a, b) {
                return dir * getCondName(a, content).localeCompare(getCondName(b, content));
            });
        } else if (content.sortBy === 'value') {
            applied.sort(function (a, b) {
                var av = getCondType(a, content) === 'value' ? (a.value || 0) : (a.active ? 1 : 0);
                var bv = getCondType(b, content) === 'value' ? (b.value || 0) : (b.active ? 1 : 0);
                return dir * (av - bv);
            });
        }
    }

    // ── Cascading Sub-conditions ──

    function activateSubconditions(typeKey, content, visited) {
        if (!visited) visited = {};
        if (visited[typeKey]) return;
        visited[typeKey] = true;

        var def = getTemplateDef(typeKey, content.template);
        if (!def || !def.subconditions || !def.subconditions.length) return;

        def.subconditions.forEach(function (subKey) {
            if (visited[subKey]) return;

            // Already in applied?
            var existing = content.applied.find(function (a) { return a.typeKey === subKey; });
            if (existing) {
                if (!existing.active) {
                    existing.active = true;
                    if (getCondType(existing, content) === 'value' && existing.value === 0) {
                        existing.value = 1;
                    }
                }
            } else {
                // In staging?
                var stagingIdx = -1;
                for (var i = 0; i < content.staging.length; i++) {
                    if (content.staging[i].typeKey === subKey) { stagingIdx = i; break; }
                }
                if (stagingIdx !== -1) {
                    var moved = content.staging.splice(stagingIdx, 1)[0];
                    moved.active = true;
                    if (getCondType(moved, content) === 'value' && moved.value === 0) moved.value = 1;
                    content.applied.push(moved);
                } else {
                    // Create from template
                    var subDef = getTemplateDef(subKey, content.template);
                    if (subDef) {
                        content.applied.push({
                            id: generateCondId(),
                            typeKey: subKey,
                            type: subDef.type,
                            value: subDef.type === 'value' ? 1 : 0,
                            active: true,
                            description: null,
                            maxValue: subDef.maxValue
                        });
                    }
                }
            }

            // One level of recursion for chained sub-conditions
            activateSubconditions(subKey, content, visited);
        });
    }

    // ── Sort Header SVGs ──
    var SORT_ASC_SVG = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
    var SORT_DESC_SVG = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';

    // ── Value Prompt ──

    function showCondValuePrompt(parentEl, defaultValue, maxValue, onConfirm, onCancel) {
        var existing = document.querySelector('.cond-value-prompt');
        if (existing) existing.remove();

        var prompt = document.createElement('div');
        prompt.className = 'cond-value-prompt';

        prompt.innerHTML =
            '<div class="cond-value-prompt-header">' +
                '<span class="cond-value-prompt-title">' + escapeHtml(t('cond.valuePrompt')) + '</span>' +
            '</div>' +
            '<input type="number" class="cond-value-input" placeholder="' + escapeHtml(t('cond.valuePlaceholder')) + '" min="0"' + (maxValue ? ' max="' + maxValue + '"' : '') + ' step="1" spellcheck="false" autocomplete="off">' +
            '<div class="cond-value-prompt-actions">' +
                '<button class="cond-value-cancel btn-secondary sm">' + escapeHtml(t('cond.cancel')) + '</button>' +
                '<button class="cond-value-ok">' + escapeHtml(t('cond.ok')) + '</button>' +
            '</div>';

        var input = prompt.querySelector('.cond-value-input');
        var okBtn = prompt.querySelector('.cond-value-ok');
        var cancelBtn = prompt.querySelector('.cond-value-cancel');

        if (defaultValue !== null && defaultValue !== undefined) input.value = defaultValue;

        function clampValue(v) {
            var n = parseInt(v, 10);
            if (isNaN(n) || n < 0) n = 0;
            if (maxValue !== null && maxValue !== undefined && n > maxValue) n = maxValue;
            return n;
        }

        function confirm() {
            var val = clampValue(input.value);
            prompt.remove();
            onConfirm(val);
        }

        function cancel() {
            prompt.remove();
            if (onCancel) onCancel();
        }

        okBtn.addEventListener('click', confirm);
        cancelBtn.addEventListener('click', cancel);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') cancel();
        });

        parentEl.appendChild(prompt);
        input.focus();
        input.select();
    }

    // ── Expand Modal (Play Mode) ──

    function openCondExpandModal(item, content, data, moduleEl) {
        var existing = document.querySelector('.cond-expand-overlay');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.className = 'cond-expand-overlay';

        var panel = document.createElement('div');
        panel.className = 'cond-expand-panel';

        var condType = getCondType(item, content);
        var condMax = getCondMaxValue(item, content);

        // Header
        var header = document.createElement('div');
        header.className = 'cond-expand-header';

        var iconSvg = getCondIconSvg(item, content);
        if (iconSvg) {
            var iconSpan = document.createElement('span');
            iconSpan.className = 'cond-expand-icon';
            iconSpan.innerHTML = iconSvg;
            header.appendChild(iconSpan);
        }

        var titleSpan = document.createElement('span');
        titleSpan.className = 'cond-expand-title';
        titleSpan.textContent = getCondName(item, content);
        header.appendChild(titleSpan);

        var closeBtn = document.createElement('button');
        closeBtn.className = 'cond-expand-close';
        closeBtn.title = t('cond.close');
        closeBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        closeBtn.addEventListener('click', function () { closeExpandModal(); });
        header.appendChild(closeBtn);
        panel.appendChild(header);

        // Body
        var body = document.createElement('div');
        body.className = 'cond-expand-body';

        // Active toggle
        var toggleRow = document.createElement('div');
        toggleRow.className = 'cond-expand-row';
        var toggleLabel = document.createElement('span');
        toggleLabel.className = 'cond-expand-label';
        toggleLabel.textContent = t('cond.active');
        toggleRow.appendChild(toggleLabel);
        var toggleBtn = document.createElement('button');
        toggleBtn.className = 'cond-expand-toggle-btn' + (item.active ? ' active' : '');
        toggleBtn.textContent = item.active ? t('cond.active') : t('cond.inactive');
        toggleBtn.addEventListener('click', function () {
            item.active = !item.active;
            toggleBtn.classList.toggle('active');
            toggleBtn.textContent = item.active ? t('cond.active') : t('cond.inactive');
            if (item.active && condType === 'value' && item.value === 0) item.value = 1;
            if (item.active) activateSubconditions(item.typeKey, content);
            scheduleSave();
            rerender();
        });
        toggleRow.appendChild(toggleBtn);
        body.appendChild(toggleRow);

        // Value editor (value type only)
        if (condType === 'value') {
            var valueRow = document.createElement('div');
            valueRow.className = 'cond-expand-row';
            var valueLabel = document.createElement('span');
            valueLabel.className = 'cond-expand-label';
            valueLabel.textContent = t('cond.sortValue');
            valueRow.appendChild(valueLabel);

            var valueControls = document.createElement('div');
            valueControls.className = 'cond-expand-value-controls';

            var minusBtn = document.createElement('button');
            minusBtn.className = 'cond-expand-value-btn';
            minusBtn.textContent = '\u2212';
            minusBtn.addEventListener('click', function () {
                if (item.value > 0) {
                    item.value--;
                    if (item.value === 0) item.active = false;
                    valDisplay.textContent = item.value;
                    toggleBtn.classList.toggle('active', item.active);
                    toggleBtn.textContent = item.active ? t('cond.active') : t('cond.inactive');
                    scheduleSave();
                    rerender();
                }
            });
            valueControls.appendChild(minusBtn);

            var valDisplay = document.createElement('span');
            valDisplay.className = 'cond-expand-value-display';
            valDisplay.textContent = item.value || 0;
            valueControls.appendChild(valDisplay);

            var plusBtn = document.createElement('button');
            plusBtn.className = 'cond-expand-value-btn';
            plusBtn.textContent = '+';
            plusBtn.addEventListener('click', function () {
                if (condMax === null || item.value < condMax) {
                    item.value++;
                    if (!item.active) {
                        item.active = true;
                        activateSubconditions(item.typeKey, content);
                    }
                    valDisplay.textContent = item.value;
                    toggleBtn.classList.toggle('active', item.active);
                    toggleBtn.textContent = item.active ? t('cond.active') : t('cond.inactive');
                    scheduleSave();
                    rerender();
                }
            });
            valueControls.appendChild(plusBtn);

            if (condMax !== null) {
                var maxLabel = document.createElement('span');
                maxLabel.className = 'cond-expand-max';
                maxLabel.textContent = '/ ' + condMax;
                valueControls.appendChild(maxLabel);
            }

            valueRow.appendChild(valueControls);
            body.appendChild(valueRow);
        }

        // Description
        var descRow = document.createElement('div');
        descRow.className = 'cond-expand-row cond-expand-desc-row';
        var descLabel = document.createElement('span');
        descLabel.className = 'cond-expand-label';
        descLabel.textContent = t('cond.wizardDescription');
        descRow.appendChild(descLabel);

        var descInput = document.createElement('textarea');
        descInput.className = 'cond-expand-desc';
        descInput.rows = 3;
        descInput.value = getCondDescription(item, content);
        descInput.placeholder = t('cond.wizardDescription');
        descInput.addEventListener('input', function () {
            item.description = descInput.value || null;
            scheduleSave();
        });
        descRow.appendChild(descInput);
        body.appendChild(descRow);

        panel.appendChild(body);

        // Footer
        var footer = document.createElement('div');
        footer.className = 'cond-expand-footer';

        var removeBtn = document.createElement('button');
        removeBtn.className = 'cond-expand-remove-btn';
        removeBtn.textContent = t('cond.remove');
        removeBtn.addEventListener('click', function () {
            // Move back to staging
            var idx = content.applied.findIndex(function (a) { return a.id === item.id; });
            if (idx !== -1) {
                var removed = content.applied.splice(idx, 1)[0];
                removed.active = false;
                removed.value = 0;
                content.staging.push(removed);
            }
            scheduleSave();
            closeExpandModal();
            rerender();
        });
        footer.appendChild(removeBtn);

        var doneBtn = document.createElement('button');
        doneBtn.className = 'cond-expand-done-btn';
        doneBtn.textContent = t('cond.close');
        doneBtn.addEventListener('click', function () { closeExpandModal(); });
        footer.appendChild(doneBtn);

        panel.appendChild(footer);
        overlay.appendChild(panel);

        overlay.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeExpandModal();
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeExpandModal();
        });

        document.body.appendChild(overlay);
        overlay.setAttribute('tabindex', '-1');
        overlay.focus();

        function closeExpandModal() {
            overlay.remove();
            rerender();
        }

        function rerender() {
            var bodyEl = moduleEl.querySelector('.module-body');
            if (bodyEl && !moduleEl.querySelector('.cond-settings-panel')) {
                var isPlay = document.querySelector('.mode-toggle') && document.querySelector('.mode-toggle').classList.contains('mode-play');
                if (isPlay) {
                    renderPlayBody(bodyEl, data);
                } else {
                    renderEditBody(bodyEl, data);
                }
                snapModuleHeight(moduleEl, data);
            }
        }
    }

    // ── Play Mode Rendering ──

    function renderPlayBody(bodyEl, data) {
        var content = ensureCondContent(data);
        bodyEl.innerHTML = '';

        if (!content.applied.length) {
            var empty = document.createElement('div');
            empty.className = 'cond-empty-state';
            empty.textContent = t('cond.emptyState');
            bodyEl.appendChild(empty);
            return;
        }

        var container = document.createElement('div');
        container.className = 'cond-play-container';

        // Sort header
        var sortHeader = buildSortHeader(content, bodyEl, data, true);
        container.appendChild(sortHeader);

        // Sort applied list
        sortAppliedList(content.applied, content);

        // Render items
        var list = document.createElement('div');
        list.className = 'cond-applied-list';

        content.applied.forEach(function (item) {
            var condType = getCondType(item, content);
            var condMax = getCondMaxValue(item, content);

            var row = document.createElement('div');
            row.className = 'cond-play-item' + (item.active === false ? ' inactive' : '');
            row.dataset.id = item.id;

            var desc = getCondDescription(item, content);
            if (desc) row.setAttribute('data-tooltip', desc);

            // Icon
            var iconSvg = getCondIconSvg(item, content);
            if (iconSvg) {
                var iconSpan = document.createElement('span');
                iconSpan.className = 'cond-play-icon';
                iconSpan.innerHTML = iconSvg;
                row.appendChild(iconSpan);
            }

            // Name (click to toggle)
            var nameSpan = document.createElement('span');
            nameSpan.className = 'cond-play-name';
            nameSpan.textContent = getCondName(item, content);
            (function (item) {
                nameSpan.addEventListener('click', function (e) {
                    e.stopPropagation();
                    item.active = !item.active;
                    if (item.active) {
                        if (condType === 'value' && item.value === 0) item.value = 1;
                        activateSubconditions(item.typeKey, content);
                    }
                    scheduleSave();
                    renderPlayBody(bodyEl, data);
                    snapModuleHeight(bodyEl.closest('.module'), data);
                });
            })(item);
            row.appendChild(nameSpan);

            // Value (click to inc, right-click to dec)
            if (condType === 'value') {
                var valSpan = document.createElement('span');
                valSpan.className = 'cond-play-value';
                valSpan.textContent = item.value || 0;
                (function (item, valSpan) {
                    valSpan.addEventListener('click', function (e) {
                        e.stopPropagation();
                        if (condMax === null || item.value < condMax) {
                            item.value++;
                            if (!item.active) {
                                item.active = true;
                                activateSubconditions(item.typeKey, content);
                            }
                            scheduleSave();
                            renderPlayBody(bodyEl, data);
                            snapModuleHeight(bodyEl.closest('.module'), data);
                        }
                    });
                    valSpan.addEventListener('contextmenu', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (item.value > 0) {
                            item.value--;
                            if (item.value === 0) item.active = false;
                            scheduleSave();
                            renderPlayBody(bodyEl, data);
                            snapModuleHeight(bodyEl.closest('.module'), data);
                        }
                    });
                })(item, valSpan);
                row.appendChild(valSpan);
            }

            // Expand button
            var expandBtn = document.createElement('button');
            expandBtn.className = 'cond-play-expand';
            expandBtn.title = t('cond.expand');
            expandBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
            (function (item) {
                expandBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    openCondExpandModal(item, content, data, bodyEl.closest('.module'));
                });
            })(item);
            row.appendChild(expandBtn);

            list.appendChild(row);
        });

        container.appendChild(list);
        bodyEl.appendChild(container);
    }

    // ── Edit Mode Rendering ──

    function renderEditBody(bodyEl, data) {
        var content = ensureCondContent(data);
        bodyEl.innerHTML = '';

        if (!content.applied.length) {
            var empty = document.createElement('div');
            empty.className = 'cond-empty-state';
            empty.textContent = t('cond.emptyState');
            bodyEl.appendChild(empty);
            return;
        }

        var container = document.createElement('div');
        container.className = 'cond-edit-container';

        // Sort header
        var sortHeader = buildSortHeader(content, bodyEl, data, false);
        container.appendChild(sortHeader);

        // Sort applied list
        sortAppliedList(content.applied, content);

        // Render items
        var list = document.createElement('div');
        list.className = 'cond-applied-list';

        content.applied.forEach(function (item) {
            var condType = getCondType(item, content);

            var row = document.createElement('div');
            row.className = 'cond-edit-item' + (item.active === false ? ' inactive' : '');

            var desc = getCondDescription(item, content);
            if (desc) row.setAttribute('data-tooltip', desc);

            var iconSvg = getCondIconSvg(item, content);
            if (iconSvg) {
                var iconSpan = document.createElement('span');
                iconSpan.className = 'cond-edit-icon';
                iconSpan.innerHTML = iconSvg;
                row.appendChild(iconSpan);
            }

            var nameSpan = document.createElement('span');
            nameSpan.className = 'cond-edit-name';
            nameSpan.textContent = getCondName(item, content);
            row.appendChild(nameSpan);

            if (condType === 'value') {
                var valSpan = document.createElement('span');
                valSpan.className = 'cond-edit-value';
                valSpan.textContent = item.value || 0;
                row.appendChild(valSpan);
            }

            list.appendChild(row);
        });

        container.appendChild(list);
        bodyEl.appendChild(container);
    }

    // ── Sort Header ──

    function buildSortHeader(content, bodyEl, data, isPlayMode) {
        var headerRow = document.createElement('div');
        headerRow.className = 'cond-sort-header';

        // Icon spacer — aligns NAME header with icon column in rows
        var iconSpacer = document.createElement('div');
        iconSpacer.className = 'cond-sort-icon-spacer';
        headerRow.appendChild(iconSpacer);

        // Name column
        var nameIsActive = content.sortBy === 'alpha';
        var nameHeader = document.createElement('div');
        nameHeader.className = 'cond-sort-header-col cond-sort-header-name' + (nameIsActive ? ' active-sort' : '');
        nameHeader.title = escapeHtml(nameIsActive
            ? (content.sortDir === 'asc' ? t('cond.sortDesc') : t('cond.sortManual'))
            : t('cond.sortAsc'));

        var nameLabel = document.createElement('span');
        nameLabel.textContent = t('cond.sortName');
        nameHeader.appendChild(nameLabel);

        if (nameIsActive) {
            var nameIndicator = document.createElement('span');
            nameIndicator.className = 'cond-sort-indicator';
            nameIndicator.innerHTML = content.sortDir === 'asc' ? SORT_ASC_SVG : SORT_DESC_SVG;
            nameHeader.appendChild(nameIndicator);
        }

        nameHeader.addEventListener('click', function () {
            if (content.sortBy === 'alpha') {
                if (content.sortDir === 'asc') {
                    content.sortDir = 'desc';
                } else {
                    content.sortBy = null;
                    content.sortDir = 'asc';
                }
            } else {
                content.sortBy = 'alpha';
                content.sortDir = 'asc';
            }
            scheduleSave();
            if (isPlayMode) renderPlayBody(bodyEl, data);
            else renderEditBody(bodyEl, data);
            snapModuleHeight(bodyEl.closest('.module'), data);
        });
        headerRow.appendChild(nameHeader);

        // Value column
        var valueIsActive = content.sortBy === 'value';
        var valueHeader = document.createElement('div');
        valueHeader.className = 'cond-sort-header-col cond-sort-header-value' + (valueIsActive ? ' active-sort' : '');
        valueHeader.title = escapeHtml(valueIsActive
            ? (content.sortDir === 'asc' ? t('cond.sortDesc') : t('cond.sortManual'))
            : t('cond.sortAsc'));

        var valueLabel = document.createElement('span');
        valueLabel.textContent = t('cond.sortValue');
        valueHeader.appendChild(valueLabel);

        if (valueIsActive) {
            var valueIndicator = document.createElement('span');
            valueIndicator.className = 'cond-sort-indicator';
            valueIndicator.innerHTML = content.sortDir === 'asc' ? SORT_ASC_SVG : SORT_DESC_SVG;
            valueHeader.appendChild(valueIndicator);
        }

        valueHeader.addEventListener('click', function () {
            if (content.sortBy === 'value') {
                if (content.sortDir === 'asc') {
                    content.sortDir = 'desc';
                } else {
                    content.sortBy = null;
                    content.sortDir = 'asc';
                }
            } else {
                content.sortBy = 'value';
                content.sortDir = 'asc';
            }
            scheduleSave();
            if (isPlayMode) renderPlayBody(bodyEl, data);
            else renderEditBody(bodyEl, data);
            snapModuleHeight(bodyEl.closest('.module'), data);
        });
        headerRow.appendChild(valueHeader);

        // Expand spacer (play mode only) — aligns VALUE header with value column
        if (isPlayMode) {
            var expandSpacer = document.createElement('div');
            expandSpacer.className = 'cond-sort-expand-spacer';
            headerRow.appendChild(expandSpacer);
        }

        return headerRow;
    }

    // ── Settings Panel ──

    function closeCondSettingsPanel(moduleEl, data) {
        var panel = moduleEl.querySelector('.cond-settings-panel');
        if (!panel) return;
        panel.querySelectorAll('.cond-applied-settings-list, .cond-staging-grid').forEach(function (el) {
            if (el._sortable) { el._sortable.destroy(); el._sortable = null; }
        });
        panel.remove();
        var bodyEl = moduleEl.querySelector('.module-body');
        renderEditBody(bodyEl, data);
        snapModuleHeight(moduleEl, data);
    }

    function openCondSettingsPanel(moduleEl, data) {
        closeCondSettingsPanel(moduleEl, data);
        var content = ensureCondContent(data);

        var panel = document.createElement('div');
        panel.className = 'cond-settings-panel';

        renderSettingsPanelContent(panel, moduleEl, data, content);

        var bodyEl = moduleEl.querySelector('.module-body');
        bodyEl.innerHTML = '';
        bodyEl.appendChild(panel);
    }

    function renderSettingsPanelContent(panel, moduleEl, data, content) {
        panel.innerHTML = '';

        // Header
        var header = document.createElement('div');
        header.className = 'cond-settings-header';

        var title = document.createElement('span');
        title.className = 'cond-settings-title';
        title.textContent = t('cond.moduleSettings');
        header.appendChild(title);

        var closeBtn = document.createElement('button');
        closeBtn.className = 'cond-settings-close';
        closeBtn.title = t('cond.close');
        closeBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        closeBtn.addEventListener('click', function () {
            closeCondSettingsPanel(moduleEl, data);
        });
        header.appendChild(closeBtn);
        panel.appendChild(header);

        // Body
        var body = document.createElement('div');
        body.className = 'cond-settings-body';

        // Template Selector
        var tplSection = document.createElement('div');
        tplSection.className = 'cond-template-section';

        var tplLabel = document.createElement('label');
        tplLabel.className = 'cond-template-label';
        tplLabel.textContent = t('cond.template');
        tplSection.appendChild(tplLabel);

        var tplSelect = document.createElement('select');
        tplSelect.className = 'cond-template-select';
        TEMPLATE_KEYS.forEach(function (key) {
            var opt = document.createElement('option');
            opt.value = key;
            opt.textContent = t(CONDITION_TEMPLATES[key].nameKey);
            if (key === content.template) opt.selected = true;
            tplSelect.appendChild(opt);
        });
        tplSelect.addEventListener('change', function () {
            var newTpl = tplSelect.value;
            if (newTpl !== content.template) {
                handleTemplateChange(newTpl, content, moduleEl, data, panel, tplSelect);
            }
        });
        tplSection.appendChild(tplSelect);
        body.appendChild(tplSection);

        // Applied section
        var appliedSection = document.createElement('div');
        appliedSection.className = 'cond-applied-section';

        var appliedLabel = document.createElement('div');
        appliedLabel.className = 'cond-section-label';
        appliedLabel.textContent = t('cond.appliedConditions');
        appliedSection.appendChild(appliedLabel);

        var appliedList = document.createElement('div');
        appliedList.className = 'cond-applied-settings-list';

        sortAppliedList(content.applied, content);

        content.applied.forEach(function (item) {
            var itemEl = createSettingsAppliedItem(item, content, data, moduleEl, panel);
            appliedList.appendChild(itemEl);
        });
        appliedSection.appendChild(appliedList);
        body.appendChild(appliedSection);

        // Staging section
        var stagingSection = document.createElement('div');
        stagingSection.className = 'cond-staging-section';

        var stagingLabel = document.createElement('div');
        stagingLabel.className = 'cond-section-label';
        stagingLabel.textContent = t('cond.availableConditions');
        stagingSection.appendChild(stagingLabel);

        var stagingGrid = document.createElement('div');
        stagingGrid.className = 'cond-staging-grid';

        // Sort staging alphabetically for display
        var sortedStaging = content.staging.slice().sort(function (a, b) {
            return getCondName(a, content).localeCompare(getCondName(b, content));
        });

        sortedStaging.forEach(function (item) {
            var itemEl = document.createElement('div');
            itemEl.className = 'cond-staging-item';
            itemEl.dataset.typeKey = item.typeKey;
            itemEl.dataset.id = item.id;

            var iconSvg = getCondIconSvg(item, content);
            if (iconSvg) {
                var iconSpan = document.createElement('span');
                iconSpan.className = 'cond-staging-icon';
                iconSpan.innerHTML = iconSvg;
                itemEl.appendChild(iconSpan);
            }

            var nameSpan = document.createElement('span');
            nameSpan.className = 'cond-staging-name';
            nameSpan.textContent = getCondName(item, content);
            itemEl.appendChild(nameSpan);

            // Delete from pool
            var delBtn = document.createElement('button');
            delBtn.className = 'cond-staging-delete';
            delBtn.title = t('cond.remove');
            delBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
            (function (item) {
                delBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var idx = content.staging.findIndex(function (s) { return s.id === item.id; });
                    if (idx !== -1) content.staging.splice(idx, 1);
                    // Also remove from customConditions if custom
                    var cIdx = content.customConditions.findIndex(function (c) { return c.key === item.typeKey; });
                    if (cIdx !== -1) content.customConditions.splice(cIdx, 1);
                    scheduleSave();
                    renderSettingsPanelContent(panel, moduleEl, data, content);
                });
            })(item);
            itemEl.appendChild(delBtn);

            stagingGrid.appendChild(itemEl);
        });

        stagingSection.appendChild(stagingGrid);

        // Create Custom button
        var createBtn = document.createElement('button');
        createBtn.className = 'cond-create-custom-btn';
        createBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
            '<span>' + escapeHtml(t('cond.createCustom')) + '</span>';
        createBtn.addEventListener('click', function () {
            openCondWizard(moduleEl, data, panel);
        });
        stagingSection.appendChild(createBtn);

        body.appendChild(stagingSection);
        panel.appendChild(body);

        // Init SortableJS
        initCondSettingsSortables(panel, moduleEl, data, content);
    }

    function createSettingsAppliedItem(item, content, data, moduleEl, panel) {
        var condType = getCondType(item, content);

        var el = document.createElement('div');
        el.className = 'cond-assigned-item';
        el.dataset.id = item.id;
        el.dataset.typeKey = item.typeKey;

        var iconSvg = getCondIconSvg(item, content);
        if (iconSvg) {
            var iconSpan = document.createElement('span');
            iconSpan.className = 'cond-assigned-icon';
            iconSpan.innerHTML = iconSvg;
            el.appendChild(iconSpan);
        }

        var nameSpan = document.createElement('span');
        nameSpan.className = 'cond-assigned-name';
        nameSpan.textContent = getCondName(item, content);
        el.appendChild(nameSpan);

        if (condType === 'value') {
            var valSpan = document.createElement('span');
            valSpan.className = 'cond-assigned-value';
            valSpan.textContent = item.value || 0;
            valSpan.addEventListener('click', function (e) {
                e.stopPropagation();
                var settingsBody = el.closest('.cond-settings-body');
                if (!settingsBody) return;
                showCondValuePrompt(settingsBody, item.value, getCondMaxValue(item, content), function (newVal) {
                    item.value = newVal;
                    if (newVal === 0) item.active = false;
                    else item.active = true;
                    scheduleSave();
                    renderSettingsPanelContent(panel, moduleEl, data, content);
                });
            });
            el.appendChild(valSpan);
        }

        var typeBadge = document.createElement('span');
        typeBadge.className = 'cond-assigned-type';
        typeBadge.textContent = condType === 'value' ? t('cond.wizardValue') : t('cond.wizardToggle');
        el.appendChild(typeBadge);

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'cond-assigned-delete';
        deleteBtn.title = t('cond.remove');
        deleteBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        deleteBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            var idx = content.applied.findIndex(function (a) { return a.id === item.id; });
            if (idx !== -1) {
                var removed = content.applied.splice(idx, 1)[0];
                removed.active = false;
                removed.value = 0;
                content.staging.push(removed);
            }
            scheduleSave();
            renderSettingsPanelContent(panel, moduleEl, data, content);
        });
        el.appendChild(deleteBtn);

        return el;
    }

    // ── SortableJS Setup ──

    function initCondSettingsSortables(panel, moduleEl, data, content) {
        var stagingGrid = panel.querySelector('.cond-staging-grid');
        var appliedList = panel.querySelector('.cond-applied-settings-list');

        if (stagingGrid) {
            stagingGrid._sortable = new Sortable(stagingGrid, {
                group: { name: 'cond-assign', pull: 'clone', put: false },
                sort: false,
                animation: 150,
                ghostClass: 'cond-ghost',
                draggable: '.cond-staging-item'
            });
        }

        if (appliedList) {
            appliedList._sortable = new Sortable(appliedList, {
                group: { name: 'cond-assign', pull: true, put: true },
                sort: !content.sortBy, // Manual reorder only when no auto-sort
                animation: 150,
                ghostClass: 'cond-ghost',
                draggable: '.cond-assigned-item',
                onAdd: function (evt) {
                    var isFromStaging = evt.from.classList.contains('cond-staging-grid');
                    var typeKey = evt.item.dataset.typeKey;
                    var itemId = evt.item.dataset.id;

                    evt.item.remove();

                    if (isFromStaging) {
                        // Check duplicate
                        if (content.applied.some(function (a) { return a.typeKey === typeKey; })) {
                            renderSettingsPanelContent(panel, moduleEl, data, content);
                            return;
                        }

                        // Find in staging
                        var stagingItem = content.staging.find(function (s) { return s.id === itemId; });
                        if (!stagingItem) {
                            renderSettingsPanelContent(panel, moduleEl, data, content);
                            return;
                        }

                        var condType = getCondType(stagingItem, content);

                        if (condType === 'value') {
                            // Prompt for value
                            var condMax = getCondMaxValue(stagingItem, content);
                            showCondValuePrompt(panel.querySelector('.cond-settings-body'), 1, condMax, function (val) {
                                // Move from staging to applied
                                var idx = content.staging.findIndex(function (s) { return s.id === itemId; });
                                if (idx !== -1) content.staging.splice(idx, 1);
                                stagingItem.value = val;
                                stagingItem.active = val > 0;
                                content.applied.push(stagingItem);
                                if (stagingItem.active) activateSubconditions(typeKey, content);
                                scheduleSave();
                                renderSettingsPanelContent(panel, moduleEl, data, content);
                            }, function () {
                                renderSettingsPanelContent(panel, moduleEl, data, content);
                            });
                        } else {
                            // Toggle — move directly
                            var idx = content.staging.findIndex(function (s) { return s.id === itemId; });
                            if (idx !== -1) content.staging.splice(idx, 1);
                            stagingItem.active = true;
                            content.applied.push(stagingItem);
                            activateSubconditions(typeKey, content);
                            scheduleSave();
                            renderSettingsPanelContent(panel, moduleEl, data, content);
                        }
                    }
                },
                onEnd: function (evt) {
                    // Manual reorder — sync data array with DOM order
                    if (!content.sortBy) {
                        var newOrder = [];
                        appliedList.querySelectorAll('.cond-assigned-item').forEach(function (el) {
                            var id = el.dataset.id;
                            var item = content.applied.find(function (a) { return a.id === id; });
                            if (item) newOrder.push(item);
                        });
                        content.applied = newOrder;
                        data.content.applied = newOrder;
                        scheduleSave();
                    }
                }
            });
        }
    }

    // ── Template Switching ──

    function handleTemplateChange(newTemplate, content, moduleEl, data, panel, selectEl) {
        var hasData = content.applied.length > 0 || content.staging.length > 0 || content.customConditions.length > 0;

        if (!hasData) {
            // No data — just switch
            applyTemplate(newTemplate, 'replace', content);
            scheduleSave();
            renderSettingsPanelContent(panel, moduleEl, data, content);
            return;
        }

        // Show dialog
        var existing = document.querySelector('.cond-template-dialog');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.className = 'cond-template-dialog';

        var dialogPanel = document.createElement('div');
        dialogPanel.className = 'cond-template-dialog-panel';

        var dialogTitle = document.createElement('div');
        dialogTitle.className = 'cond-template-dialog-title';
        dialogTitle.textContent = t('cond.templateWarnTitle');
        dialogPanel.appendChild(dialogTitle);

        var dialogMsg = document.createElement('div');
        dialogMsg.className = 'cond-template-dialog-msg';
        dialogMsg.textContent = t('cond.templateWarnMsg');
        dialogPanel.appendChild(dialogMsg);

        var dialogActions = document.createElement('div');
        dialogActions.className = 'cond-template-dialog-actions';

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'cond-template-dialog-btn';
        cancelBtn.textContent = t('cond.templateCancel');
        cancelBtn.addEventListener('click', function () {
            selectEl.value = content.template;
            overlay.remove();
        });
        dialogActions.appendChild(cancelBtn);

        var mergeBtn = document.createElement('button');
        mergeBtn.className = 'cond-template-dialog-btn cond-template-dialog-btn-merge';
        mergeBtn.textContent = t('cond.templateMerge');
        mergeBtn.addEventListener('click', function () {
            overlay.remove();
            applyTemplate(newTemplate, 'merge', content);
            scheduleSave();
            renderSettingsPanelContent(panel, moduleEl, data, content);
        });
        dialogActions.appendChild(mergeBtn);

        var replaceBtn = document.createElement('button');
        replaceBtn.className = 'cond-template-dialog-btn cond-template-dialog-btn-replace';
        replaceBtn.textContent = t('cond.templateReplace');
        replaceBtn.addEventListener('click', function () {
            overlay.remove();
            applyTemplate(newTemplate, 'replace', content);
            scheduleSave();
            renderSettingsPanelContent(panel, moduleEl, data, content);
        });
        dialogActions.appendChild(replaceBtn);

        dialogPanel.appendChild(dialogActions);
        overlay.appendChild(dialogPanel);

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                selectEl.value = content.template;
                overlay.remove();
            }
        });
        overlay.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                selectEl.value = content.template;
                overlay.remove();
            }
        });

        document.body.appendChild(overlay);
        overlay.setAttribute('tabindex', '-1');
        overlay.focus();
    }

    function applyTemplate(templateKey, mode, content) {
        var tpl = CONDITION_TEMPLATES[templateKey];
        if (!tpl) return;

        if (mode === 'replace') {
            content.applied = [];
            content.staging = [];
            content.customConditions = [];
        }

        content.template = templateKey;

        // Build set of existing typeKeys
        var existingKeys = {};
        content.applied.forEach(function (a) { existingKeys[a.typeKey] = true; });
        content.staging.forEach(function (s) { existingKeys[s.typeKey] = true; });

        // Add template conditions to staging (skip duplicates)
        tpl.conditions.forEach(function (def) {
            if (!existingKeys[def.key]) {
                content.staging.push({
                    id: generateCondId(),
                    typeKey: def.key,
                    type: def.type,
                    value: 0,
                    active: false,
                    description: null,
                    maxValue: def.maxValue
                });
            }
        });

        console.log('[CV] Template applied: ' + templateKey + ' (' + mode + ')');
    }

    // ── Custom Condition Wizard ──

    function openCondWizard(moduleEl, data, settingsPanel) {
        var content = ensureCondContent(data);

        var overlay = document.createElement('div');
        overlay.className = 'cond-wizard-overlay';

        var wizPanel = document.createElement('div');
        wizPanel.className = 'cond-wizard-panel';

        var selectedIcon = null;
        var wizardName = '';
        var wizardType = 'toggle';
        var wizardDesc = '';
        var wizardMaxValue = null;

        // Header
        var header = document.createElement('div');
        header.className = 'cond-wizard-header';

        var titleEl = document.createElement('span');
        titleEl.className = 'cond-wizard-title';
        titleEl.textContent = t('cond.wizardTitle');
        header.appendChild(titleEl);

        var closeBtn = document.createElement('button');
        closeBtn.className = 'cond-wizard-close';
        closeBtn.title = t('cond.close');
        closeBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        closeBtn.addEventListener('click', function () { overlay.remove(); });
        header.appendChild(closeBtn);
        wizPanel.appendChild(header);

        // Body
        var body = document.createElement('div');
        body.className = 'cond-wizard-body';

        // Icon section
        var iconSection = document.createElement('div');
        iconSection.className = 'cond-wizard-section';
        var iconLabel = document.createElement('label');
        iconLabel.className = 'cond-wizard-label';
        iconLabel.textContent = t('cond.wizardIcon');
        iconSection.appendChild(iconLabel);

        var iconGrid = document.createElement('div');
        iconGrid.className = 'cond-wizard-icon-grid';

        var iconKeys = Object.keys(CONDITION_ICON_SVG).sort();
        iconKeys.forEach(function (key) {
            var btn = document.createElement('button');
            btn.className = 'cond-wizard-icon-btn';
            btn.dataset.iconKey = key;
            btn.innerHTML = CONDITION_ICON_SVG[key];
            var tipLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');
            var _tip = null;
            btn.addEventListener('mouseenter', function () {
                _tip = document.createElement('div');
                _tip.className = 'cond-wizard-icon-tooltip';
                _tip.textContent = tipLabel;
                document.body.appendChild(_tip);
                var rect = btn.getBoundingClientRect();
                var tw = _tip.offsetWidth;
                var th = _tip.offsetHeight;
                var left = rect.left + rect.width / 2 - tw / 2;
                var top = rect.top - th - 6;
                left = Math.max(4, Math.min(left, window.innerWidth - tw - 4));
                _tip.style.left = left + 'px';
                _tip.style.top = top + 'px';
                _tip.style.opacity = '1';
            });
            btn.addEventListener('mouseleave', function () {
                if (_tip) { _tip.remove(); _tip = null; }
            });
            btn.addEventListener('click', function () {
                iconGrid.querySelectorAll('.cond-wizard-icon-btn').forEach(function (b) { b.classList.remove('selected'); });
                btn.classList.add('selected');
                selectedIcon = key;
            });
            iconGrid.appendChild(btn);
        });
        iconSection.appendChild(iconGrid);
        body.appendChild(iconSection);

        // Name section
        var nameSection = document.createElement('div');
        nameSection.className = 'cond-wizard-section';
        var nameLabel = document.createElement('label');
        nameLabel.className = 'cond-wizard-label';
        nameLabel.textContent = t('cond.wizardName');
        nameSection.appendChild(nameLabel);

        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'cond-wizard-name-input';
        nameInput.placeholder = t('cond.wizardNamePlaceholder');
        nameInput.spellcheck = false;
        nameInput.autocomplete = 'off';
        nameInput.addEventListener('input', function () {
            wizardName = nameInput.value.trim();
            createBtn.disabled = !wizardName;
        });
        nameSection.appendChild(nameInput);
        body.appendChild(nameSection);

        // Type section
        var typeSection = document.createElement('div');
        typeSection.className = 'cond-wizard-section';
        var typeLabel = document.createElement('label');
        typeLabel.className = 'cond-wizard-label';
        typeLabel.textContent = t('cond.wizardType');
        typeSection.appendChild(typeLabel);

        var typeToggle = document.createElement('div');
        typeToggle.className = 'cond-wizard-type-toggle';

        var toggleTypeBtn = document.createElement('button');
        toggleTypeBtn.className = 'cond-wizard-type-btn selected';
        toggleTypeBtn.textContent = t('cond.wizardToggle');
        toggleTypeBtn.addEventListener('click', function () {
            wizardType = 'toggle';
            toggleTypeBtn.classList.add('selected');
            valueTypeBtn.classList.remove('selected');
            maxValueRow.style.display = 'none';
        });
        typeToggle.appendChild(toggleTypeBtn);

        var valueTypeBtn = document.createElement('button');
        valueTypeBtn.className = 'cond-wizard-type-btn';
        valueTypeBtn.textContent = t('cond.wizardValue');
        valueTypeBtn.addEventListener('click', function () {
            wizardType = 'value';
            valueTypeBtn.classList.add('selected');
            toggleTypeBtn.classList.remove('selected');
            maxValueRow.style.display = '';
        });
        typeToggle.appendChild(valueTypeBtn);
        typeSection.appendChild(typeToggle);

        // Max value input (shown for value type)
        var maxValueRow = document.createElement('div');
        maxValueRow.className = 'cond-wizard-maxvalue-row';
        maxValueRow.style.display = 'none';

        var maxValueLabel = document.createElement('label');
        maxValueLabel.className = 'cond-wizard-label';
        maxValueLabel.textContent = t('cond.wizardMaxValue');
        maxValueRow.appendChild(maxValueLabel);

        var maxValueInput = document.createElement('input');
        maxValueInput.type = 'number';
        maxValueInput.className = 'cond-wizard-maxvalue-input';
        maxValueInput.min = 1;
        maxValueInput.placeholder = t('cond.wizardMaxValuePlaceholder');
        maxValueInput.addEventListener('input', function () {
            var v = parseInt(maxValueInput.value, 10);
            wizardMaxValue = isNaN(v) || v < 1 ? null : v;
        });
        maxValueRow.appendChild(maxValueInput);
        typeSection.appendChild(maxValueRow);

        body.appendChild(typeSection);

        // Description section
        var descSection = document.createElement('div');
        descSection.className = 'cond-wizard-section cond-wizard-section-last';
        var descLabel = document.createElement('label');
        descLabel.className = 'cond-wizard-label';
        descLabel.textContent = t('cond.wizardDescription');
        descSection.appendChild(descLabel);

        var descInput = document.createElement('textarea');
        descInput.className = 'cond-wizard-desc-input';
        descInput.rows = 2;
        descInput.placeholder = t('cond.wizardDescPlaceholder');
        descInput.addEventListener('input', function () {
            wizardDesc = descInput.value.trim();
        });
        descSection.appendChild(descInput);
        body.appendChild(descSection);

        wizPanel.appendChild(body);

        // Footer
        var footer = document.createElement('div');
        footer.className = 'cond-wizard-footer';

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'cond-wizard-btn-cancel btn-secondary';
        cancelBtn.textContent = t('cond.wizardCancel');
        cancelBtn.addEventListener('click', function () { overlay.remove(); });
        footer.appendChild(cancelBtn);

        var createBtn = document.createElement('button');
        createBtn.className = 'cond-wizard-btn-create btn-primary solid';
        createBtn.textContent = t('cond.wizardCreate');
        createBtn.disabled = true;
        createBtn.addEventListener('click', function () {
            if (!wizardName) return;
            var customKey = 'custom_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            content.customConditions.push({
                key: customKey,
                name: wizardName,
                icon: selectedIcon || 'alert',
                type: wizardType,
                description: wizardDesc || '',
                maxValue: wizardType === 'value' ? wizardMaxValue : null,
                subconditions: []
            });
            // Add to staging
            content.staging.push({
                id: generateCondId(),
                typeKey: customKey,
                type: wizardType,
                value: 0,
                active: false,
                description: wizardDesc || null,
                maxValue: wizardType === 'value' ? wizardMaxValue : null
            });
            scheduleSave();
            overlay.remove();
            if (settingsPanel) {
                renderSettingsPanelContent(settingsPanel, moduleEl, data, content);
            }
            console.log('[CV] Custom condition created: ' + wizardName);
        });
        footer.appendChild(createBtn);
        wizPanel.appendChild(footer);

        // Escape key
        overlay.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') overlay.remove();
        });

        overlay.appendChild(wizPanel);
        document.body.appendChild(overlay);
        nameInput.focus();
    }

    // ── Module Type Registration ──

    registerModuleType('condition', {
        label: 'type.condition',

        renderBody: function (bodyEl, data, isPlayMode) {
            ensureCondContent(data);
            if (isPlayMode) {
                renderPlayBody(bodyEl, data);
            } else {
                renderEditBody(bodyEl, data);
            }
        },

        onPlayMode: function (moduleEl, data) {
            closeCondSettingsPanel(moduleEl, data);
            var bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, true);
        },

        onEditMode: function (moduleEl, data) {
            var bodyEl = moduleEl.querySelector('.module-body');
            this.renderBody(bodyEl, data, false);
        },

        syncState: function (moduleEl, data) {
            // Data is mutated directly via event handlers; no form sync needed
        }
    });

    // Expose for module-core.js
    window.openCondSettings = function (moduleEl, data) {
        openCondSettingsPanel(moduleEl, data);
    };

    console.log('[CV] Condition module registered');
})();
