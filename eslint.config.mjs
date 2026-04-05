import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        files: ['scripts/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                // ── Browser globals ──
                ...globals.browser,

                // ── CDN libraries ──
                Sortable: 'readonly',
                marked: 'readonly',
                DOMPurify: 'readonly',

                // ── TaleSpire API ──
                TS: 'readonly',

                // ── translations.js ──
                CV_TRANSLATIONS: 'readonly',

                // ── shared.js ──
                escapeHtml: 'readonly',
                renderMarkdown: 'readonly',
                attachCheckboxHandlers: 'readonly',
                showToast: 'readonly',
                toggleCheckboxInMarkdown: 'readonly',
                CV_ICONS: 'readonly',
                CV_SVG_SORT_UP: 'readonly',
                CV_SVG_SORT_DOWN: 'readonly',

                // ── i18n.js ──
                currentLang: 'writable',
                t: 'readonly',
                applyTranslations: 'readonly',
                refreshModuleLabels: 'readonly',

                // ── theme.js ──
                setTheme: 'readonly',
                loadTheme: 'readonly',

                // ── settings.js ──
                modeToggle: 'readonly',
                settingsOverlay: 'readonly',
                openSettings: 'readonly',
                closeSettings: 'readonly',
                updateThemeButtons: 'readonly',
                chkAutoSave: 'readonly',
                chkAutoLoad: 'readonly',

                // ── persistence.js ──
                migrateData: 'readonly',
                syncModuleState: 'readonly',
                serializeCharacter: 'readonly',
                deserializeCharacter: 'readonly',
                saveCharacter: 'readonly',
                loadCharacter: 'readonly',
                scheduleSave: 'writable',

                // ── module-core.js ──
                modules: 'writable',
                moduleIdCounter: 'writable',
                MODULE_TYPES: 'readonly',
                registerModuleType: 'readonly',
                moduleGrid: 'readonly',
                updateEmptyState: 'readonly',
                renderModule: 'readonly',
                openDeleteConfirm: 'readonly',
                applyPlayMode: 'readonly',
                applyEditMode: 'readonly',
                GRID_COLUMNS: 'readonly',
                GRID_GAP: 'readonly',
                ROW_H: 'readonly',
                snapModuleHeight: 'readonly',
                initResizeHandle: 'readonly',
                openWizard: 'readonly',
                closeWizard: 'readonly',
                THEME_SWATCHES: 'readonly',
                buildSwatchPanel: 'readonly',
                sortable: 'readonly',
                generateModuleId: 'readonly',
                wizardState: 'readonly',
                deleteModule: 'readonly',
                closeDeleteConfirm: 'readonly',

                // ── module-stat.js ──
                STAT_TEMPLATES: 'readonly',
                applyStatTemplate: 'readonly',
                updateRollableBtn: 'readonly',

                // ── module-health.js ──
                openHealthActionOverlay: 'readonly',

                // ── module-abilities.js ──
                ABILITY_TEMPLATES: 'readonly',
                applyAbilityTemplate: 'readonly',
                openAbilitySettings: 'readonly',

                // ── module-savingthrow.js ──
                applySavingThrowTemplate: 'readonly',
                applyTierPreset: 'readonly',
                openSaveSettings: 'readonly',

                // ── module-condition.js ──
                openCondSettings: 'readonly',

                // ── module-list.js ──
                addListItem: 'readonly',
                openListManageAttrs: 'readonly',

                // ── module-resistance.js ──
                openResSettings: 'readonly',

                // ── module-counters.js ──
                openCounterCreateModal: 'readonly',
                COUNTER_ICON_SVG: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-undef': 'error',
            eqeqeq: 'warn',
            'no-var': 'warn',
            'prefer-const': 'warn',
        },
    },
];
