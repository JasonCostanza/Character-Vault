// ── Theme ──
(function () {
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('cv-theme', theme);
    }

    function loadTheme() {
        const saved = localStorage.getItem('cv-theme') ?? 'dark';
        setTheme(saved);
    }

    loadTheme();

    function applyUiScale(scale) {
        document.body.style.zoom = scale;
    }

    function loadUiScale() {
        const saved = localStorage.getItem('cv-ui-scale') ?? '1';
        applyUiScale(saved);
    }

    loadUiScale();

    window.setTheme = setTheme;
    window.loadTheme = loadTheme;
    window.applyUiScale = applyUiScale;
})();
