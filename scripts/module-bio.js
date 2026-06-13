// ── Bio Module ──
(function () {

    // ── Constants ──
    const RACE_LABELS = {
        dnd5e: 'bio.species',
        pf2e: 'bio.ancestry',
        daggerheart: 'bio.ancestry',
        sr6: 'bio.metatype',
        coc: 'bio.race',
        cpred: 'bio.race',
        vtm: 'bio.race',
        mothership: 'bio.race',
        custom: 'bio.race',
    };

    const SYSTEM_FIELDS = {
        dnd5e:       { name: 'D&D 5th Edition',         fields: ['backgroundName'] },
        pf2e:        { name: 'Pathfinder 2e',            fields: ['backgroundName', 'heritage', 'edicts', 'anathemas'] },
        coc:         { name: 'Call of Cthulhu',          fields: ['occupation', 'ideologyBeliefs'] },
        cpred:       { name: 'Cyberpunk Red',            fields: ['culturalOrigin'] },
        daggerheart: { name: 'Daggerheart',              fields: ['community'] },
        sr6:         { name: 'Shadowrun 6e',             fields: ['lifestyle'] },
        vtm:         { name: 'Vampire: The Masquerade',  fields: ['clan', 'generation', 'sire', 'predatorType', 'ambition', 'desire'] },
    };

    const TEXTAREA_FIELDS = new Set([
        'appearance', 'biography', 'personalityTraits', 'ideals', 'bonds', 'flaws',
        'likesDislikes', 'alliesEnemies', 'organizations', 'edicts', 'anathemas', 'ideologyBeliefs',
    ]);

    // ── Pure helpers (exposed on window for tests) ──

    function shouldShowBioField(value) {
        return value != null && value !== '';
    }

    function getRaceLabel(gameSystem) {
        return RACE_LABELS[gameSystem] || 'bio.race';
    }

    function getSystemFields(gameSystem) {
        return SYSTEM_FIELDS[gameSystem] || null;
    }

    function buildBioDefaultContent() {
        return {
            activeTab: 'overview',
            portrait: null,
            name: '', pronouns: '', race: '', alignment: '',
            age: '', height: '', weight: '', eyes: '', hair: '', skin: '',
            appearance: '', biography: '',
            showPersonality: false,
            personalityTraits: '', ideals: '', bonds: '', flaws: '',
            deity: '', birthplace: '', nationality: '', ethnicity: '', alias: '',
            likesDislikes: '', alliesEnemies: '', organizations: '',
            backgroundName: '', heritage: '', edicts: '', anathemas: '',
            occupation: '', ideologyBeliefs: '', culturalOrigin: '',
            community: '', lifestyle: '',
            clan: '', generation: '', sire: '', predatorType: '', ambition: '', desire: '',
        };
    }

    // ── DOM builder helpers ──

    function buildBioField(key, labelKey, value, opts) {
        const type = (opts && opts.type) || 'text';
        const rows = (opts && opts.rows) || 3;
        const placeholder = (opts && opts.placeholder) || '';
        const widthClass = (opts && opts.widthClass) || '';

        const div = document.createElement('div');
        div.className = 'bio-field' + (widthClass ? ' ' + widthClass : '');

        const label = document.createElement('span');
        label.className = 'bio-field-label';
        label.setAttribute('data-i18n', labelKey);
        label.textContent = t(labelKey);
        div.appendChild(label);

        let input;
        if (type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = rows;
        } else {
            input = document.createElement('input');
            input.type = 'text';
        }
        input.className = 'bio-field-input';
        input.value = value || '';
        input.dataset.key = key;
        if (placeholder) {
            input.setAttribute('data-i18n-placeholder', placeholder);
            input.placeholder = t(placeholder);
        }
        div.appendChild(input);
        return div;
    }

    function buildBioFieldPlay(labelKey, value, opts) {
        const isBlock = (opts && opts.isBlock) || false;
        const isName = (opts && opts.isName) || false;
        const widthClass = (opts && opts.widthClass) || '';

        const div = document.createElement('div');
        div.className = 'bio-field' + (widthClass ? ' ' + widthClass : '');

        const label = document.createElement('span');
        label.className = 'bio-field-label';
        label.setAttribute('data-i18n', labelKey);
        label.textContent = t(labelKey);
        div.appendChild(label);

        const val = document.createElement('div');
        let cls = 'bio-field-value';
        if (isName) cls += ' name';
        if (isBlock) cls += ' block';
        val.className = cls;
        val.textContent = value || '';
        div.appendChild(val);
        return div;
    }

    function buildSectionDivider(labelKey) {
        const div = document.createElement('div');
        div.className = 'bio-section-divider';
        const span = document.createElement('span');
        span.className = 'bio-section-label';
        span.setAttribute('data-i18n', labelKey);
        span.textContent = t(labelKey);
        div.appendChild(span);
        return div;
    }

    function buildCollapseHeader(isExpanded) {
        const div = document.createElement('div');
        div.className = 'bio-collapse-header' + (isExpanded ? ' expanded' : '');

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'bio-collapse-chevron');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        poly.setAttribute('points', '9 18 15 12 9 6');
        svg.appendChild(poly);
        div.appendChild(svg);

        const span = document.createElement('span');
        span.className = 'bio-section-label';
        span.setAttribute('data-i18n', 'bio.personality');
        span.textContent = t('bio.personality');
        div.appendChild(span);
        return div;
    }

    function buildPortraitFrame(data, isPlayMode, onRerender) {
        const frame = document.createElement('div');
        frame.className = 'bio-portrait-frame' + (isPlayMode ? ' play-mode' : '');

        if (data.portrait) {
            const img = document.createElement('img');
            img.src = data.portrait;
            img.alt = '';
            frame.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'bio-portrait-placeholder';
            placeholder.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>';
            frame.appendChild(placeholder);
        }

        if (!isPlayMode) {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.png,.jpg,.jpeg,.webp';
            fileInput.style.display = 'none';

            const controls = document.createElement('div');
            controls.className = 'bio-portrait-controls';
            controls.appendChild(fileInput);

            if (data.portrait) {
                const changeBtn = document.createElement('button');
                changeBtn.className = 'bio-portrait-btn';
                changeBtn.setAttribute('data-i18n', 'bio.portraitChange');
                changeBtn.textContent = t('bio.portraitChange');
                changeBtn.addEventListener('click', () => fileInput.click());
                controls.appendChild(changeBtn);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'bio-portrait-btn danger';
                removeBtn.setAttribute('data-i18n', 'bio.portraitRemove');
                removeBtn.textContent = t('bio.portraitRemove');
                removeBtn.addEventListener('click', () => {
                    data.portrait = null;
                    scheduleSave();
                    onRerender();
                });
                controls.appendChild(removeBtn);
            } else {
                const uploadBtn = document.createElement('button');
                uploadBtn.className = 'bio-portrait-btn';
                uploadBtn.setAttribute('data-i18n', 'bio.portraitUpload');
                uploadBtn.textContent = t('bio.portraitUpload');
                uploadBtn.addEventListener('click', () => fileInput.click());
                controls.appendChild(uploadBtn);
            }

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const objectUrl = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => {
                    const MAX = 300;
                    const ratio = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
                    const w = Math.round(img.naturalWidth * ratio);
                    const h = Math.round(img.naturalHeight * ratio);
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    URL.revokeObjectURL(objectUrl);
                    data.portrait = canvas.toDataURL('image/jpeg', 0.8);
                    scheduleSave();
                    onRerender();
                };
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    console.log('[CV] Bio portrait load error');
                };
                img.src = objectUrl;
            });

            frame.appendChild(controls);
        }
        return frame;
    }

    // ── Overview Tab — Edit Mode ──
    function renderOverviewEdit(container, data) {
        container.innerHTML = '';

        const portraitArea = document.createElement('div');
        portraitArea.className = 'bio-portrait-area';

        const frame = buildPortraitFrame(data, false, () => renderOverviewEdit(container, data));
        portraitArea.appendChild(frame);

        const identitySide = document.createElement('div');
        identitySide.className = 'bio-identity-side';

        identitySide.appendChild(buildBioField('name', 'bio.name', data.name, { placeholder: 'bio.namePlaceholder', widthClass: 'w3' }));

        const idRow = document.createElement('div');
        idRow.className = 'bio-field-row';
        const raceLabel = getRaceLabel(window.gameSystem || 'custom');
        idRow.appendChild(buildBioField('pronouns', 'bio.pronouns', data.pronouns, { placeholder: 'bio.pronounsPlaceholder' }));
        idRow.appendChild(buildBioField('race', raceLabel, data.race, { widthClass: 'w2' }));
        identitySide.appendChild(idRow);

        identitySide.appendChild(buildBioField('alignment', 'bio.alignment', data.alignment));

        portraitArea.appendChild(identitySide);
        container.appendChild(portraitArea);

        container.appendChild(buildSectionDivider('bio.physical'));

        const physRow = document.createElement('div');
        physRow.className = 'bio-field-row wrap';
        ['age', 'height', 'weight', 'eyes', 'hair', 'skin'].forEach((key) => {
            physRow.appendChild(buildBioField(key, 'bio.' + key, data[key], { widthClass: 'fixed-sm' }));
        });
        container.appendChild(physRow);

        container.appendChild(buildBioField('appearance', 'bio.appearance', data.appearance, {
            type: 'textarea', rows: 2, placeholder: 'bio.appearancePlaceholder',
        }));

        container.appendChild(buildSectionDivider('bio.biography'));
        container.appendChild(buildBioField('biography', 'bio.biography', data.biography, {
            type: 'textarea', rows: 4, placeholder: 'bio.biographyPlaceholder',
        }));

        const collapseHeader = buildCollapseHeader(data.showPersonality);
        container.appendChild(collapseHeader);

        const personalityGrid = document.createElement('div');
        personalityGrid.className = 'bio-personality-grid';
        personalityGrid.style.display = data.showPersonality ? 'grid' : 'none';
        [
            { key: 'personalityTraits', labelKey: 'bio.traits' },
            { key: 'ideals',            labelKey: 'bio.ideals' },
            { key: 'bonds',             labelKey: 'bio.bonds' },
            { key: 'flaws',             labelKey: 'bio.flaws' },
        ].forEach(({ key, labelKey }) => {
            personalityGrid.appendChild(buildBioField(key, labelKey, data[key], { type: 'textarea', rows: 3 }));
        });
        container.appendChild(personalityGrid);

        collapseHeader.addEventListener('click', () => {
            data.showPersonality = !data.showPersonality;
            collapseHeader.classList.toggle('expanded', data.showPersonality);
            personalityGrid.style.display = data.showPersonality ? 'grid' : 'none';
            scheduleSave();
        });

        container.querySelectorAll('.bio-field-input').forEach((input) => {
            input.addEventListener('input', () => {
                data[input.dataset.key] = input.value;
                scheduleSave();
            });
        });
    }

    // ── Overview Tab — Play Mode ──
    function renderOverviewPlay(container, data) {
        container.innerHTML = '';

        const portraitArea = document.createElement('div');
        portraitArea.className = 'bio-portrait-area';
        portraitArea.appendChild(buildPortraitFrame(data, true, null));

        const identitySide = document.createElement('div');
        identitySide.className = 'bio-identity-side';

        if (shouldShowBioField(data.name)) {
            identitySide.appendChild(buildBioFieldPlay('bio.name', data.name, { isName: true }));
        }

        const idRow = document.createElement('div');
        idRow.className = 'bio-field-row';
        const raceLabel = getRaceLabel(window.gameSystem || 'custom');
        let idHasContent = false;
        if (shouldShowBioField(data.pronouns)) {
            idRow.appendChild(buildBioFieldPlay('bio.pronouns', data.pronouns));
            idHasContent = true;
        }
        if (shouldShowBioField(data.race)) {
            idRow.appendChild(buildBioFieldPlay(raceLabel, data.race, { widthClass: 'w2' }));
            idHasContent = true;
        }
        if (idHasContent) identitySide.appendChild(idRow);

        if (shouldShowBioField(data.alignment)) {
            identitySide.appendChild(buildBioFieldPlay('bio.alignment', data.alignment));
        }

        portraitArea.appendChild(identitySide);
        container.appendChild(portraitArea);

        const physKeys = ['age', 'height', 'weight', 'eyes', 'hair', 'skin'];
        const hasPhys = physKeys.some((k) => shouldShowBioField(data[k]));
        if (hasPhys) {
            container.appendChild(buildSectionDivider('bio.physical'));
            const physRow = document.createElement('div');
            physRow.className = 'bio-field-row wrap';
            physKeys.forEach((key) => {
                if (shouldShowBioField(data[key])) {
                    physRow.appendChild(buildBioFieldPlay('bio.' + key, data[key], { widthClass: 'fixed-sm' }));
                }
            });
            container.appendChild(physRow);
        }

        if (shouldShowBioField(data.appearance)) {
            container.appendChild(buildBioFieldPlay('bio.appearance', data.appearance, { isBlock: true }));
        }

        if (shouldShowBioField(data.biography)) {
            container.appendChild(buildSectionDivider('bio.biography'));
            const bioDisplay = document.createElement('div');
            bioDisplay.className = 'bio-biography-display';
            bioDisplay.innerHTML = renderMarkdown(data.biography);
            container.appendChild(bioDisplay);
        }

        const personalityDefs = [
            { key: 'personalityTraits', labelKey: 'bio.traits' },
            { key: 'ideals',            labelKey: 'bio.ideals' },
            { key: 'bonds',             labelKey: 'bio.bonds' },
            { key: 'flaws',             labelKey: 'bio.flaws' },
        ];
        const hasPersonality = data.showPersonality && personalityDefs.some((f) => shouldShowBioField(data[f.key]));
        if (hasPersonality) {
            container.appendChild(buildSectionDivider('bio.personality'));
            const grid = document.createElement('div');
            grid.className = 'bio-personality-grid';
            personalityDefs.forEach(({ key, labelKey }) => {
                if (!shouldShowBioField(data[key])) return;
                const block = document.createElement('div');
                block.className = 'bio-play-personality-block';
                const blockLabel = document.createElement('div');
                blockLabel.className = 'bio-play-personality-label';
                blockLabel.setAttribute('data-i18n', labelKey);
                blockLabel.textContent = t(labelKey);
                block.appendChild(blockLabel);
                const blockText = document.createElement('div');
                blockText.className = 'bio-play-personality-text';
                blockText.textContent = data[key];
                block.appendChild(blockText);
                grid.appendChild(block);
            });
            container.appendChild(grid);
        }
    }

    // ── System-gated section (shared between edit/play) ──

    function renderSystemSectionEdit(container, data, sysData) {
        const header = document.createElement('div');
        header.className = 'bio-system-header';
        const sysName = document.createElement('span');
        sysName.className = 'bio-system-name';
        sysName.textContent = sysData.name;
        header.appendChild(sysName);
        container.appendChild(header);

        if (sysData.fields.includes('clan')) {
            // VtM: two rows of three
            const row1 = document.createElement('div');
            row1.className = 'bio-field-row';
            row1.appendChild(buildBioField('clan', 'bio.clan', data.clan));
            row1.appendChild(buildBioField('generation', 'bio.generation', data.generation, { widthClass: 'fixed-md' }));
            row1.appendChild(buildBioField('sire', 'bio.sire', data.sire));
            container.appendChild(row1);
            const row2 = document.createElement('div');
            row2.className = 'bio-field-row';
            row2.appendChild(buildBioField('predatorType', 'bio.predatorType', data.predatorType));
            row2.appendChild(buildBioField('ambition', 'bio.ambition', data.ambition));
            row2.appendChild(buildBioField('desire', 'bio.desire', data.desire));
            container.appendChild(row2);
        } else if (sysData.fields.includes('heritage')) {
            // PF2e: background + heritage row, then edicts, anathemas
            const row = document.createElement('div');
            row.className = 'bio-field-row';
            row.appendChild(buildBioField('backgroundName', 'bio.background', data.backgroundName));
            row.appendChild(buildBioField('heritage', 'bio.heritage', data.heritage));
            container.appendChild(row);
            container.appendChild(buildBioField('edicts', 'bio.edicts', data.edicts, { type: 'textarea', rows: 2 }));
            container.appendChild(buildBioField('anathemas', 'bio.anathemas', data.anathemas, { type: 'textarea', rows: 2 }));
        } else {
            const fieldOpts = {
                backgroundName:  { labelKey: 'bio.background' },
                occupation:      { labelKey: 'bio.occupation' },
                ideologyBeliefs: { labelKey: 'bio.ideologyBeliefs', type: 'textarea', rows: 2 },
                culturalOrigin:  { labelKey: 'bio.culturalOrigin' },
                community:       { labelKey: 'bio.community' },
                lifestyle:       { labelKey: 'bio.lifestyle' },
            };
            sysData.fields.forEach((key) => {
                const cfg = fieldOpts[key] || { labelKey: 'bio.' + key };
                container.appendChild(buildBioField(key, cfg.labelKey, data[key], {
                    type: cfg.type || 'text', rows: cfg.rows || 3,
                }));
            });
        }
    }

    function renderSystemSectionPlay(container, data, sysData) {
        const hasContent = sysData.fields.some((k) => shouldShowBioField(data[k]));
        if (!hasContent) return;

        const header = document.createElement('div');
        header.className = 'bio-system-header';
        const sysName = document.createElement('span');
        sysName.className = 'bio-system-name';
        sysName.textContent = sysData.name;
        header.appendChild(sysName);
        container.appendChild(header);

        const blockFields = new Set(['edicts', 'anathemas', 'ideologyBeliefs']);
        const fieldLabelKeys = {
            backgroundName: 'bio.background', heritage: 'bio.heritage',
            edicts: 'bio.edicts', anathemas: 'bio.anathemas',
            occupation: 'bio.occupation', ideologyBeliefs: 'bio.ideologyBeliefs',
            culturalOrigin: 'bio.culturalOrigin', community: 'bio.community',
            lifestyle: 'bio.lifestyle', clan: 'bio.clan', generation: 'bio.generation',
            sire: 'bio.sire', predatorType: 'bio.predatorType',
            ambition: 'bio.ambition', desire: 'bio.desire',
        };

        sysData.fields.forEach((key) => {
            if (!shouldShowBioField(data[key])) return;
            const labelKey = fieldLabelKeys[key] || 'bio.' + key;
            if (blockFields.has(key)) {
                const block = document.createElement('div');
                block.className = 'bio-play-block';
                const lbl = document.createElement('div');
                lbl.className = 'bio-play-block-label';
                lbl.setAttribute('data-i18n', labelKey);
                lbl.textContent = t(labelKey);
                block.appendChild(lbl);
                const txt = document.createElement('div');
                txt.className = 'bio-play-block-text';
                txt.textContent = data[key];
                block.appendChild(txt);
                container.appendChild(block);
            } else {
                container.appendChild(buildBioFieldPlay(labelKey, data[key]));
            }
        });
    }

    // ── Details Tab — Edit Mode ──
    function renderDetailsEdit(container, data) {
        container.innerHTML = '';

        const row1 = document.createElement('div');
        row1.className = 'bio-field-row';
        row1.appendChild(buildBioField('deity', 'bio.deity', data.deity, { placeholder: 'bio.deityPlaceholder', widthClass: 'w2' }));
        row1.appendChild(buildBioField('birthplace', 'bio.birthplace', data.birthplace, { widthClass: 'w2' }));
        container.appendChild(row1);

        const row2 = document.createElement('div');
        row2.className = 'bio-field-row';
        row2.appendChild(buildBioField('nationality', 'bio.nationality', data.nationality));
        row2.appendChild(buildBioField('ethnicity', 'bio.ethnicity', data.ethnicity));
        row2.appendChild(buildBioField('alias', 'bio.alias', data.alias, { placeholder: 'bio.aliasPlaceholder' }));
        container.appendChild(row2);

        container.appendChild(buildBioField('likesDislikes', 'bio.likesDislikes', data.likesDislikes, { type: 'textarea', rows: 2 }));
        container.appendChild(buildBioField('alliesEnemies', 'bio.alliesEnemies', data.alliesEnemies, { type: 'textarea', rows: 2 }));
        container.appendChild(buildBioField('organizations', 'bio.organizations', data.organizations, { type: 'textarea', rows: 2 }));

        const sys = window.gameSystem || 'custom';
        if (sys === 'custom') {
            Object.values(SYSTEM_FIELDS).forEach((sysData) => renderSystemSectionEdit(container, data, sysData));
        } else if (SYSTEM_FIELDS[sys]) {
            renderSystemSectionEdit(container, data, SYSTEM_FIELDS[sys]);
        }

        container.querySelectorAll('.bio-field-input').forEach((input) => {
            input.addEventListener('input', () => {
                data[input.dataset.key] = input.value;
                scheduleSave();
            });
        });
    }

    // ── Details Tab — Play Mode ──
    function renderDetailsPlay(container, data) {
        container.innerHTML = '';

        const shortFields = [
            { key: 'deity',       labelKey: 'bio.deity' },
            { key: 'birthplace',  labelKey: 'bio.birthplace' },
            { key: 'nationality', labelKey: 'bio.nationality' },
            { key: 'ethnicity',   labelKey: 'bio.ethnicity' },
            { key: 'alias',       labelKey: 'bio.alias' },
        ];
        const textareaFields = [
            { key: 'likesDislikes',  labelKey: 'bio.likesDislikes' },
            { key: 'alliesEnemies',  labelKey: 'bio.alliesEnemies' },
            { key: 'organizations',  labelKey: 'bio.organizations' },
        ];

        const shortRow = document.createElement('div');
        shortRow.className = 'bio-field-row wrap';
        let hasShort = false;
        shortFields.forEach(({ key, labelKey }) => {
            if (!shouldShowBioField(data[key])) return;
            shortRow.appendChild(buildBioFieldPlay(labelKey, data[key]));
            hasShort = true;
        });
        if (hasShort) container.appendChild(shortRow);

        textareaFields.forEach(({ key, labelKey }) => {
            if (!shouldShowBioField(data[key])) return;
            const block = document.createElement('div');
            block.className = 'bio-play-block';
            const lbl = document.createElement('div');
            lbl.className = 'bio-play-block-label';
            lbl.setAttribute('data-i18n', labelKey);
            lbl.textContent = t(labelKey);
            block.appendChild(lbl);
            const txt = document.createElement('div');
            txt.className = 'bio-play-block-text';
            txt.textContent = data[key];
            block.appendChild(txt);
            container.appendChild(block);
        });

        const sys = window.gameSystem || 'custom';
        if (sys === 'custom') {
            Object.values(SYSTEM_FIELDS).forEach((sysData) => renderSystemSectionPlay(container, data, sysData));
        } else if (SYSTEM_FIELDS[sys]) {
            renderSystemSectionPlay(container, data, SYSTEM_FIELDS[sys]);
        }
    }

    // ── Tab content dispatcher ──
    function renderTabContent(tabContentEl, content, isPlayMode) {
        if (content.activeTab === 'details') {
            if (isPlayMode) renderDetailsPlay(tabContentEl, content);
            else renderDetailsEdit(tabContentEl, content);
        } else {
            if (isPlayMode) renderOverviewPlay(tabContentEl, content);
            else renderOverviewEdit(tabContentEl, content);
        }
    }

    // ── Sync inputs back to data ──
    function syncBioInputs(containerEl, content) {
        containerEl.querySelectorAll('.bio-field-input').forEach((input) => {
            if (input.dataset.key) content[input.dataset.key] = input.value;
        });
    }

    // ── Module Registration ──
    registerModuleType('bio', {
        label: 'type.bio',

        renderBody(bodyEl, data, isPlayMode) {
            const content = data.content;
            const moduleEl = bodyEl.closest('.module');
            if (moduleEl) moduleEl.dataset.bioMode = isPlayMode ? 'play' : 'edit';

            // Tab bar
            const tabBar = document.createElement('div');
            tabBar.className = 'bio-tab-bar';

            const overviewBtn = document.createElement('button');
            overviewBtn.className = 'bio-tab' + (content.activeTab !== 'details' ? ' active' : '');
            overviewBtn.setAttribute('data-tab', 'overview');
            overviewBtn.setAttribute('data-i18n', 'bio.overview');
            overviewBtn.textContent = t('bio.overview');
            tabBar.appendChild(overviewBtn);

            const detailsBtn = document.createElement('button');
            detailsBtn.className = 'bio-tab' + (content.activeTab === 'details' ? ' active' : '');
            detailsBtn.setAttribute('data-tab', 'details');
            detailsBtn.setAttribute('data-i18n', 'bio.details');
            detailsBtn.textContent = t('bio.details');
            tabBar.appendChild(detailsBtn);

            bodyEl.appendChild(tabBar);

            const tabContentEl = document.createElement('div');
            tabContentEl.className = 'bio-tab-content';
            bodyEl.appendChild(tabContentEl);

            renderTabContent(tabContentEl, content, isPlayMode);

            [overviewBtn, detailsBtn].forEach((btn) => {
                btn.addEventListener('click', () => {
                    if (btn.dataset.tab === content.activeTab) return;
                    syncBioInputs(bodyEl, content);
                    content.activeTab = btn.dataset.tab;
                    overviewBtn.classList.toggle('active', content.activeTab !== 'details');
                    detailsBtn.classList.toggle('active', content.activeTab === 'details');
                    const isPlay = bodyEl.closest('.module')?.dataset.bioMode === 'play';
                    renderTabContent(tabContentEl, content, isPlay);
                    scheduleSave();
                });
            });
        },

        onPlayMode(moduleEl) {
            moduleEl.dataset.bioMode = 'play';
            const data = modules.find((m) => m.id === moduleEl.dataset.id);
            if (!data) return;
            const tabContentEl = moduleEl.querySelector('.bio-tab-content');
            if (tabContentEl) {
                renderTabContent(tabContentEl, data.content, true);
                if (data.content.activeTab !== 'details') {
                    const bioDisplay = tabContentEl.querySelector('.bio-biography-display');
                    if (bioDisplay) attachCheckboxHandlers(bioDisplay, data, moduleEl);
                }
            }
        },

        onLayoutMode(moduleEl) {
            moduleEl.dataset.bioMode = 'edit';
            const data = modules.find((m) => m.id === moduleEl.dataset.id);
            if (!data) return;
            const tabContentEl = moduleEl.querySelector('.bio-tab-content');
            if (tabContentEl) renderTabContent(tabContentEl, data.content, false);
        },

        syncState(moduleEl, data) {
            syncBioInputs(moduleEl, data.content);
        },
    });

    // ── Expose pure functions for vitest ──
    window.buildBioDefaultContent = buildBioDefaultContent;
    window.getRaceLabel = getRaceLabel;
    window.getSystemFields = getSystemFields;
    window.shouldShowBioField = shouldShowBioField;

})();
