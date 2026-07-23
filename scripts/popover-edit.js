// ── Shared Edit Popover (Ctrl+Click quick editing) ──
(function () {
    // ── Math Expression Resolver ──
    // Resolves simple math input into an integer, or null if invalid.
    // With `relative`, a leading operator applies against `currentValue`
    // (e.g. current 9, input "+2" → 11). Without it, input evaluates
    // absolutely so signed fields accept "-1" as a literal value.
    function resolveMathExpression(raw, currentValue, relative) {
        var str = String(raw === null || raw === undefined ? '' : raw).trim();
        if (!str) return null;
        if (!/^[\d+\-*/.()\s]+$/.test(str)) return null;
        if (relative && /^[+\-*/]/.test(str)) {
            str = '(' + (Number(currentValue) || 0) + ')' + str;
        }
        try {
            var result = Function('"use strict"; return (' + str + ')')();
            if (typeof result !== 'number' || !isFinite(result)) return null;
            return Math.floor(result);
        } catch {
            return null;
        }
    }

    // ── Popover ──
    var activePopover = null;

    // openEditPopover(anchorEl, options)
    //   options.label       — heading text (already translated / user content)
    //   options.value       — current value (single-field shorthand)
    //   options.type        — 'text' | 'number' (default 'text')
    //   options.min/max     — clamp bounds for number fields
    //   options.relative    — leading-operator math applies to current value
    //   options.allowEmpty  — number fields: empty input commits null
    //   options.fields      — multi-field form: [{ key, label, value, type, min, max, relative, allowEmpty }]
    //                         onSave receives { key: value } instead of a single value
    //   options.onSave(value | values) — called after commit
    //   options.onCancel()  — called on Escape / click-outside discard
    function openEditPopover(anchorEl, options) {
        closeActivePopover();

        var single = !options.fields;
        var fields = options.fields || [
            {
                key: 'value',
                value: options.value,
                type: options.type,
                min: options.min,
                max: options.max,
                relative: options.relative,
                allowEmpty: options.allowEmpty,
            },
        ];

        var pop = document.createElement('div');
        pop.className = 'cv-edit-popover';

        if (options.label) {
            var labelEl = document.createElement('div');
            labelEl.className = 'cv-edit-popover-label';
            labelEl.textContent = options.label;
            pop.appendChild(labelEl);
        }

        var fieldsWrap = document.createElement('div');
        fieldsWrap.className = 'cv-edit-popover-fields';
        var inputs = fields.map(function (f) {
            var fieldEl = document.createElement('div');
            fieldEl.className = 'cv-edit-popover-field';
            if (f.label) {
                var fieldLabel = document.createElement('label');
                fieldLabel.className = 'cv-edit-popover-field-label';
                fieldLabel.textContent = f.label;
                fieldEl.appendChild(fieldLabel);
            }
            // Always type="text": number fields accept math expressions.
            var input = document.createElement('input');
            input.type = 'text';
            input.className = 'cv-input cv-edit-popover-input';
            input.value = f.value === null || f.value === undefined ? '' : f.value;
            input.spellcheck = false;
            input.autocomplete = 'off';
            input.addEventListener('input', function () {
                input.classList.remove('invalid');
            });
            fieldEl.appendChild(input);
            fieldsWrap.appendChild(fieldEl);
            return input;
        });
        pop.appendChild(fieldsWrap);

        var footer = document.createElement('div');
        footer.className = 'cv-edit-popover-footer';
        var hint = document.createElement('span');
        hint.className = 'cv-edit-popover-hint';
        hint.textContent = t('popover.hint');
        var saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn-primary sm cv-edit-popover-save';
        saveBtn.textContent = t('common.save');
        footer.appendChild(hint);
        footer.appendChild(saveBtn);
        pop.appendChild(footer);

        var moduleEl = anchorEl.closest ? anchorEl.closest('.module') : null;
        if (moduleEl) moduleEl.classList.add('module--chrome-active');

        function close() {
            pop.remove();
            document.removeEventListener('click', onOutsideClick, true);
            if (moduleEl) moduleEl.classList.remove('module--chrome-active');
            activePopover = null;
        }

        function commit() {
            var resolved = [];
            var firstInvalid = null;
            fields.forEach(function (f, i) {
                var raw = inputs[i].value;
                if (f.type === 'number') {
                    if (raw.trim() === '' && f.allowEmpty) {
                        resolved[i] = null;
                        return;
                    }
                    var val = resolveMathExpression(raw, f.value, f.relative);
                    if (val === null) {
                        inputs[i].classList.add('invalid');
                        if (!firstInvalid) firstInvalid = inputs[i];
                        return;
                    }
                    if (typeof f.min === 'number' && val < f.min) val = f.min;
                    if (typeof f.max === 'number' && val > f.max) val = f.max;
                    resolved[i] = val;
                } else {
                    resolved[i] = raw.trim();
                }
            });
            if (firstInvalid) {
                firstInvalid.focus();
                firstInvalid.select();
                return;
            }
            var result;
            if (single) {
                result = resolved[0];
            } else {
                result = {};
                fields.forEach(function (f, i) {
                    result[f.key] = resolved[i];
                });
            }
            close();
            if (options.onSave) options.onSave(result);
        }

        function cancel() {
            close();
            if (options.onCancel) options.onCancel();
        }

        function onOutsideClick(e) {
            if (!pop.contains(e.target)) cancel();
        }

        saveBtn.addEventListener('click', commit);
        pop.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                commit();
            }
            if (e.key === 'Escape') {
                e.stopPropagation();
                cancel();
            }
        });

        document.body.appendChild(pop);

        // Position below the anchor; flip above if it would leave the viewport
        var rect = anchorEl.getBoundingClientRect();
        pop.style.top = rect.bottom + 6 + 'px';
        pop.style.left = rect.left + 'px';
        var popRect = pop.getBoundingClientRect();
        if (popRect.right > window.innerWidth - 4) {
            pop.style.left = Math.max(4, window.innerWidth - popRect.width - 4) + 'px';
        }
        if (popRect.bottom > window.innerHeight - 4) {
            pop.style.top = Math.max(4, rect.top - popRect.height - 6) + 'px';
        }

        activePopover = { el: pop, cancel: cancel };

        inputs[0].focus();
        inputs[0].select();

        // Deferred so the opening Ctrl+Click doesn't immediately dismiss it
        requestAnimationFrame(function () {
            document.addEventListener('click', onOutsideClick, true);
        });
    }

    function closeActivePopover() {
        if (activePopover) activePopover.cancel();
    }

    // Expose: openEditPopover for modules, resolveMathExpression for tests
    window.openEditPopover = openEditPopover;
    window.resolveMathExpression = resolveMathExpression;
})();
