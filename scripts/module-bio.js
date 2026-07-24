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
        dnd5e: { name: 'D&D 5th Edition', fields: ['backgroundName'] },
        pf2e: { name: 'Pathfinder 2e', fields: ['backgroundName', 'heritage', 'edicts', 'anathemas'] },
        coc: { name: 'Call of Cthulhu', fields: ['occupation', 'ideologyBeliefs'] },
        cpred: { name: 'Cyberpunk Red', fields: ['culturalOrigin'] },
        daggerheart: { name: 'Daggerheart', fields: ['community'] },
        sr6: { name: 'Shadowrun 6e', fields: ['lifestyle'] },
        vtm: {
            name: 'Vampire: The Masquerade',
            fields: ['clan', 'generation', 'sire', 'predatorType', 'ambition', 'desire'],
        },
    };

    const SYSTEM_FIELD_LABELS = {
        backgroundName: 'bio.background',
        heritage: 'bio.heritage',
        edicts: 'bio.edicts',
        anathemas: 'bio.anathemas',
        occupation: 'bio.occupation',
        ideologyBeliefs: 'bio.ideologyBeliefs',
        culturalOrigin: 'bio.culturalOrigin',
        community: 'bio.community',
        lifestyle: 'bio.lifestyle',
        clan: 'bio.clan',
        generation: 'bio.generation',
        sire: 'bio.sire',
        predatorType: 'bio.predatorType',
        ambition: 'bio.ambition',
        desire: 'bio.desire',
    };

    const TEXTAREA_FIELDS = new Set([
        'appearance',
        'biography',
        'personalityTraits',
        'ideals',
        'bonds',
        'flaws',
        'likesDislikes',
        'alliesEnemies',
        'organizations',
        'edicts',
        'anathemas',
        'ideologyBeliefs',
    ]);

    const PERSONALITY_FIELDS = [
        { key: 'personalityTraits', labelKey: 'bio.traits' },
        { key: 'ideals', labelKey: 'bio.ideals' },
        { key: 'bonds', labelKey: 'bio.bonds' },
        { key: 'flaws', labelKey: 'bio.flaws' },
    ];

    const NOTES_FIELDS = [
        { key: 'likesDislikes', labelKey: 'bio.likesDislikes' },
        { key: 'alliesEnemies', labelKey: 'bio.alliesEnemies' },
        { key: 'organizations', labelKey: 'bio.organizations' },
    ];

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
            name: '',
            pronouns: '',
            race: '',
            alignment: '',
            age: '',
            height: '',
            weight: '',
            eyes: '',
            hair: '',
            skin: '',
            appearance: '',
            biography: '',
            showPersonality: false,
            personalityTraits: '',
            ideals: '',
            bonds: '',
            flaws: '',
            deity: '',
            birthplace: '',
            nationality: '',
            ethnicity: '',
            alias: '',
            likesDislikes: '',
            alliesEnemies: '',
            organizations: '',
            backgroundName: '',
            heritage: '',
            edicts: '',
            anathemas: '',
            occupation: '',
            ideologyBeliefs: '',
            culturalOrigin: '',
            community: '',
            lifestyle: '',
            clan: '',
            generation: '',
            sire: '',
            predatorType: '',
            ambition: '',
            desire: '',
        };
    }

    function activeSystemFieldSets(sys) {
        if (sys === 'custom') return Object.values(SYSTEM_FIELDS);
        return SYSTEM_FIELDS[sys] ? [SYSTEM_FIELDS[sys]] : [];
    }

    // ── Current-tab re-render ──

    function reRenderCurrentTab(moduleEl, content) {
        const tabContentEl = moduleEl && moduleEl.querySelector('.bio-tab-content');
        if (tabContentEl) renderTabContent(tabContentEl, content, moduleEl);
    }

    // ── Ctrl+Click quick edit (short fields) ──

    function enterBioFieldQuickEdit(anchorEl, content, key, label, moduleEl) {
        window.openEditPopover(anchorEl, {
            label,
            value: content[key],
            type: 'text',
            onSave(newVal) {
                content[key] = newVal;
                scheduleSave();
                reRenderCurrentTab(moduleEl, content);
            },
        });
    }

    // ── DOM builder helpers ──

    function buildBioField(labelKey, value, opts) {
        opts = opts || {};
        const { widthClass, isName, isBlock, key, content, moduleEl, placeholderKey } = opts;

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
        const hasValue = shouldShowBioField(value);
        if (!hasValue) cls += ' bio-field-value--empty';
        val.className = cls;
        val.textContent = hasValue ? value : t(placeholderKey || 'bio.clickToAdd');
        div.appendChild(val);

        if (key) {
            val.addEventListener('click', (e) => {
                if (!(e.ctrlKey || e.metaKey)) return;
                enterBioFieldQuickEdit(val, content, key, t(labelKey), moduleEl);
            });
        }

        return div;
    }

    function buildLabeledTextBlock(wrapperClass, labelClass, textClass, labelKey, value) {
        const block = document.createElement('div');
        block.className = wrapperClass;

        const lbl = document.createElement('div');
        lbl.className = labelClass;
        lbl.setAttribute('data-i18n', labelKey);
        lbl.textContent = t(labelKey);
        block.appendChild(lbl);

        const hasValue = shouldShowBioField(value);
        const txt = document.createElement('div');
        txt.className = textClass + (hasValue ? '' : ' bio-field-value--empty');
        txt.textContent = hasValue ? value : t('bio.addDetails');
        block.appendChild(txt);

        return block;
    }

    function buildBioBlockField(labelKey, value) {
        return buildLabeledTextBlock('bio-play-block', 'bio-play-block-label', 'bio-play-block-text', labelKey, value);
    }

    function buildPersonalityBlock(labelKey, value) {
        return buildLabeledTextBlock(
            'bio-play-personality-block',
            'bio-play-personality-label',
            'bio-play-personality-text',
            labelKey,
            value
        );
    }

    function buildBiographyDisplay(content) {
        const bioDisplay = document.createElement('div');
        const hasValue = shouldShowBioField(content.biography);
        if (hasValue) {
            bioDisplay.className = 'bio-biography-display';
            bioDisplay.innerHTML = renderMarkdown(content.biography);
        } else {
            bioDisplay.className = 'bio-biography-display bio-field-value--empty';
            bioDisplay.textContent = t('bio.biographyPlaceholder');
        }
        return bioDisplay;
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

    function buildPortraitFrame(content, moduleEl) {
        const frame = document.createElement('div');
        frame.className = 'bio-portrait-frame';

        if (content.portrait) {
            const img = document.createElement('img');
            img.src = content.portrait;
            img.alt = '';
            frame.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'bio-portrait-placeholder';
            placeholder.innerHTML = cvIcon('user');
            frame.appendChild(placeholder);
        }

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.png,.jpg,.jpeg,.webp';
        fileInput.style.display = 'none';

        const controls = document.createElement('div');
        controls.className = 'bio-portrait-controls';
        controls.appendChild(fileInput);

        if (content.portrait) {
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
                content.portrait = null;
                scheduleSave();
                reRenderCurrentTab(moduleEl, content);
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
                content.portrait = canvas.toDataURL('image/jpeg', 0.8);
                scheduleSave();
                reRenderCurrentTab(moduleEl, content);
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                console.log('[CV] Bio portrait load error');
            };
            img.src = objectUrl;
        });

        frame.appendChild(controls);
        return frame;
    }

    // ── Overview Tab ──
    function renderOverview(container, content, moduleEl) {
        container.innerHTML = '';

        const portraitArea = document.createElement('div');
        portraitArea.className = 'bio-portrait-area';
        portraitArea.appendChild(buildPortraitFrame(content, moduleEl));

        const identitySide = document.createElement('div');
        identitySide.className = 'bio-identity-side';

        identitySide.appendChild(
            buildBioField('bio.name', content.name, {
                isName: true,
                key: 'name',
                content,
                moduleEl,
                widthClass: 'w3',
                placeholderKey: 'bio.namePlaceholder',
            })
        );

        const idRow = document.createElement('div');
        idRow.className = 'bio-field-row';
        const raceLabel = getRaceLabel(window.gameSystem || 'custom');
        idRow.appendChild(
            buildBioField('bio.pronouns', content.pronouns, {
                key: 'pronouns',
                content,
                moduleEl,
                placeholderKey: 'bio.pronounsPlaceholder',
            })
        );
        idRow.appendChild(
            buildBioField(raceLabel, content.race, { key: 'race', content, moduleEl, widthClass: 'w2' })
        );
        identitySide.appendChild(idRow);

        identitySide.appendChild(
            buildBioField('bio.alignment', content.alignment, { key: 'alignment', content, moduleEl })
        );

        portraitArea.appendChild(identitySide);
        container.appendChild(portraitArea);

        container.appendChild(buildSectionDivider('bio.physical'));

        const physRow = document.createElement('div');
        physRow.className = 'bio-field-row wrap';
        ['age', 'height', 'weight', 'eyes', 'hair', 'skin'].forEach((key) => {
            physRow.appendChild(
                buildBioField('bio.' + key, content[key], { key, content, moduleEl, widthClass: 'fixed-sm' })
            );
        });
        container.appendChild(physRow);

        container.appendChild(
            buildBioField('bio.appearance', content.appearance, {
                isBlock: true,
                placeholderKey: 'bio.appearancePlaceholder',
            })
        );

        container.appendChild(buildSectionDivider('bio.biography'));
        container.appendChild(buildBiographyDisplay(content));

        const collapseHeader = buildCollapseHeader(content.showPersonality);
        container.appendChild(collapseHeader);

        const personalityGrid = document.createElement('div');
        personalityGrid.className = 'bio-personality-grid';
        personalityGrid.style.display = content.showPersonality ? 'grid' : 'none';
        PERSONALITY_FIELDS.forEach(({ key, labelKey }) => {
            personalityGrid.appendChild(buildPersonalityBlock(labelKey, content[key]));
        });
        container.appendChild(personalityGrid);

        collapseHeader.addEventListener('click', () => {
            content.showPersonality = !content.showPersonality;
            collapseHeader.classList.toggle('expanded', content.showPersonality);
            personalityGrid.style.display = content.showPersonality ? 'grid' : 'none';
            scheduleSave();
        });
    }

    // ── System-gated section ──

    function renderSystemSection(container, content, sysData, moduleEl) {
        const header = document.createElement('div');
        header.className = 'bio-system-header';
        const sysName = document.createElement('span');
        sysName.className = 'bio-system-name';
        sysName.textContent = sysData.name;
        header.appendChild(sysName);
        container.appendChild(header);

        sysData.fields.forEach((key) => {
            const labelKey = SYSTEM_FIELD_LABELS[key] || 'bio.' + key;
            if (TEXTAREA_FIELDS.has(key)) {
                container.appendChild(buildBioBlockField(labelKey, content[key]));
            } else {
                container.appendChild(buildBioField(labelKey, content[key], { key, content, moduleEl }));
            }
        });
    }

    // ── Details Tab ──
    function renderDetails(container, content, moduleEl) {
        container.innerHTML = '';

        const row1 = document.createElement('div');
        row1.className = 'bio-field-row';
        row1.appendChild(
            buildBioField('bio.deity', content.deity, {
                key: 'deity',
                content,
                moduleEl,
                widthClass: 'w2',
                placeholderKey: 'bio.deityPlaceholder',
            })
        );
        row1.appendChild(
            buildBioField('bio.birthplace', content.birthplace, { key: 'birthplace', content, moduleEl, widthClass: 'w2' })
        );
        container.appendChild(row1);

        const row2 = document.createElement('div');
        row2.className = 'bio-field-row';
        row2.appendChild(buildBioField('bio.nationality', content.nationality, { key: 'nationality', content, moduleEl }));
        row2.appendChild(buildBioField('bio.ethnicity', content.ethnicity, { key: 'ethnicity', content, moduleEl }));
        row2.appendChild(
            buildBioField('bio.alias', content.alias, {
                key: 'alias',
                content,
                moduleEl,
                placeholderKey: 'bio.aliasPlaceholder',
            })
        );
        container.appendChild(row2);

        NOTES_FIELDS.forEach(({ key, labelKey }) => {
            container.appendChild(buildBioBlockField(labelKey, content[key]));
        });

        const sys = window.gameSystem || 'custom';
        activeSystemFieldSets(sys).forEach((sysData) => renderSystemSection(container, content, sysData, moduleEl));
    }

    // ── Tab content dispatcher ──
    function renderTabContent(tabContentEl, content, moduleEl) {
        if (content.activeTab === 'details') renderDetails(tabContentEl, content, moduleEl);
        else renderOverview(tabContentEl, content, moduleEl);
    }

    // ── Textarea edit modal (long-form fields, opened from the overflow menu) ──
    function openBioTextareaModal(moduleEl, content, titleKey, fields) {
        const existing = document.querySelector('.bio-edit-overlay');
        if (existing) existing.remove();

        const snapshot = fields.map((f) => content[f.key] || '');

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay bio-edit-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t(titleKey);
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('module.close');
        closeXBtn.innerHTML = cvIcon('x', 12);
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cv-modal-body';
        const textareas = fields.map((f) => {
            const label = document.createElement('span');
            label.className = 'cv-modal-label';
            label.setAttribute('data-i18n', f.labelKey);
            label.textContent = t(f.labelKey);
            body.appendChild(label);

            const textarea = document.createElement('textarea');
            textarea.className = 'cv-modal-input';
            textarea.rows = f.rows || 3;
            textarea.placeholder = t(f.placeholderKey || 'bio.addDetails');
            textarea.value = content[f.key] || '';
            body.appendChild(textarea);
            return textarea;
        });
        panel.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('module.cancel');
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('common.save');
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        textareas[0].focus();

        function closeModal() {
            document.removeEventListener('keydown', keyHandler);
            overlay.remove();
        }

        function isDirty() {
            return fields.some((f, i) => textareas[i].value !== snapshot[i]);
        }

        function doClose() {
            if (isDirty()) {
                showConfirm(t('common.discardChanges'), closeModal);
            } else {
                closeModal();
            }
        }

        function doSave() {
            fields.forEach((f, i) => {
                content[f.key] = textareas[i].value;
            });
            scheduleSave();
            reRenderCurrentTab(moduleEl, content);
            closeModal();
        }

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                doClose();
            }
        };
        document.addEventListener('keydown', keyHandler);
        saveBtn.addEventListener('click', doSave);
        cancelBtn.addEventListener('click', doClose);
        closeXBtn.addEventListener('click', doClose);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) doClose();
        });
    }

    // ── Module Registration ──
    registerModuleType('bio', {
        label: 'type.bio',

        renderBody(bodyEl, data) {
            const content = data.content;
            const moduleEl = bodyEl.closest('.module');

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

            renderTabContent(tabContentEl, content, moduleEl);

            [overviewBtn, detailsBtn].forEach((btn) => {
                btn.addEventListener('click', () => {
                    if (btn.dataset.tab === content.activeTab) return;
                    content.activeTab = btn.dataset.tab;
                    overviewBtn.classList.toggle('active', content.activeTab !== 'details');
                    detailsBtn.classList.toggle('active', content.activeTab === 'details');
                    renderTabContent(tabContentEl, content, moduleEl);
                    scheduleSave();
                });
            });
        },

        overflowMenuItems(moduleEl, data) {
            const content = data.content;
            const sys = window.gameSystem || 'custom';
            const backgroundFields = activeSystemFieldSets(sys)
                .flatMap((sysData) => sysData.fields)
                .filter((key) => TEXTAREA_FIELDS.has(key))
                .map((key) => ({ key, labelKey: SYSTEM_FIELD_LABELS[key] || 'bio.' + key, rows: 2 }));

            const items = [
                {
                    onClick: () =>
                        openBioTextareaModal(moduleEl, content, 'bio.editAppearance', [
                            {
                                key: 'appearance',
                                labelKey: 'bio.appearance',
                                rows: 4,
                                placeholderKey: 'bio.appearancePlaceholder',
                            },
                        ]),
                    label: t('bio.editAppearance'),
                    icon: cvIcon('pencil', 14),
                },
                {
                    onClick: () =>
                        openBioTextareaModal(moduleEl, content, 'bio.editBiography', [
                            {
                                key: 'biography',
                                labelKey: 'bio.biography',
                                rows: 6,
                                placeholderKey: 'bio.biographyPlaceholder',
                            },
                        ]),
                    label: t('bio.editBiography'),
                    icon: cvIcon('pencil', 14),
                },
                {
                    onClick: () =>
                        openBioTextareaModal(
                            moduleEl,
                            content,
                            'bio.editPersonality',
                            PERSONALITY_FIELDS.map((f) => ({ ...f, rows: 3 }))
                        ),
                    label: t('bio.editPersonality'),
                    icon: cvIcon('pencil', 14),
                },
                {
                    onClick: () =>
                        openBioTextareaModal(
                            moduleEl,
                            content,
                            'bio.editNotes',
                            NOTES_FIELDS.map((f) => ({ ...f, rows: 2 }))
                        ),
                    label: t('bio.editNotes'),
                    icon: cvIcon('pencil', 14),
                },
            ];

            if (backgroundFields.length) {
                items.push({
                    onClick: () => openBioTextareaModal(moduleEl, content, 'bio.editBackground', backgroundFields),
                    label: t('bio.editBackground'),
                    icon: cvIcon('pencil', 14),
                });
            }

            return items;
        },
    });

    // ── Expose pure functions for vitest ──
    window.buildBioDefaultContent = buildBioDefaultContent;
    window.getRaceLabel = getRaceLabel;
    window.getSystemFields = getSystemFields;
    window.shouldShowBioField = shouldShowBioField;
})();
