// ── Theme ──
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cv-theme', theme);
}

function loadTheme() {
    const saved = localStorage.getItem('cv-theme') ?? 'dark';
    setTheme(saved);
}

loadTheme();
