// ── Tab System ──
(function () {

    // ── Tab State ──
    window.tabs = [];
    window.activeTabId = null;

    let tabIdCounter = 0;
    window.getTabIdCounter = function () { return tabIdCounter; };
    window.setTabIdCounter = function (n) { tabIdCounter = n; };

    window.generateTabId = function () {
        return 'tab-' + (++tabIdCounter);
    };

    window.getActiveTab = function () {
        return window.tabs.find(function (t) { return t.id === window.activeTabId; });
    };

    window.getNextTabName = function () {
        const existing = new Set(window.tabs.map(function (t) { return t.name; }));
        let n = 1;
        let candidate;
        do { candidate = t('tabs.defaultName', { n: n++ }); } while (existing.has(candidate));
        return candidate;
    };

    window.createTab = function (name, color) {
        const tab = {
            id: window.generateTabId(),
            name: (name != null && name !== '') ? name : window.getNextTabName(),
            order: window.tabs.length,
            color: color ?? null,
        };
        window.tabs.push(tab);
        return tab;
    };

    // ── Tab Bar Rendering ──
    window.renderTabBar = function () {
        const scrollArea = document.getElementById('tab-scroll-area');
        if (!scrollArea) return;

        scrollArea.innerHTML = '';

        const sorted = window.tabs.slice().sort(function (a, b) { return a.order - b.order; });
        sorted.forEach(function (tab) {
            const el = document.createElement('div');
            el.className = 'tab-item' + (tab.id === window.activeTabId ? ' active' : '');
            el.dataset.tabId = tab.id;
            el.textContent = tab.name;
            el.setAttribute('title', tab.name);
            if (tab.color) {
                el.style.backgroundColor = tab.color;
            }
            scrollArea.appendChild(el);
        });
    };

})();
