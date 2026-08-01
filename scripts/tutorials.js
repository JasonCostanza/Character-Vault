// ── Tutorials ──
(function () {
    const TUTORIALS = {};

    function renderTutorialText(key) {
        return t(key).replace(/\{icon:(\w[\w-]*)\}/g, (_, name) => cvIcon(name, 14));
    }

    function openTutorialModal(type) {
        const existing = document.querySelector('.tutorial-overlay');
        if (existing) existing.remove();

        const pages = TUTORIALS[type];
        if (!pages || !pages.length) return;

        let currentPage = 0;

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay tutorial-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';
        panel.style.width = '320px';

        // ── Header ──
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        const closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = t('tutorial.close');
        closeXBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        // ── Body ──
        const body = document.createElement('div');
        body.className = 'cv-modal-body';
        const textEl = document.createElement('div');
        textEl.className = 'tutorial-body-text';
        const dotsEl = document.createElement('div');
        dotsEl.className = 'tutorial-dots';
        body.appendChild(textEl);
        body.appendChild(dotsEl);
        panel.appendChild(body);

        // ── Footer ──
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer tutorial-footer';
        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'btn-secondary sm';
        prevBtn.textContent = t('tutorial.previous');
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-secondary sm';
        closeBtn.textContent = t('tutorial.close');
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'btn-primary sm';
        nextBtn.textContent = t('tutorial.next');
        footer.appendChild(prevBtn);
        footer.appendChild(closeBtn);
        footer.appendChild(nextBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function renderPage() {
            const page = pages[currentPage];
            titleEl.textContent = t(page.titleKey);
            textEl.innerHTML = renderTutorialText(page.bodyKey);
            dotsEl.innerHTML = '';
            pages.forEach((_, i) => {
                const dot = document.createElement('span');
                dot.className = 'tutorial-dot' + (i === currentPage ? ' active' : '');
                dotsEl.appendChild(dot);
            });
            prevBtn.style.visibility = currentPage === 0 ? 'hidden' : 'visible';
            nextBtn.style.visibility = currentPage === pages.length - 1 ? 'hidden' : 'visible';
        }

        function close() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }

        prevBtn.addEventListener('click', () => {
            if (currentPage === 0) return;
            currentPage--;
            renderPage();
        });
        nextBtn.addEventListener('click', () => {
            if (currentPage === pages.length - 1) return;
            currentPage++;
            renderPage();
        });
        closeBtn.addEventListener('click', close);
        closeXBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                close();
            }
        };
        document.addEventListener('keydown', keyHandler);

        renderPage();
    }

    window.openTutorialModal = openTutorialModal;
})();
