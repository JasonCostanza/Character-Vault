// ── Modifier Key Tracker ──
// Vuplex WebView zeroes ctrlKey on all events.
// This tracks Ctrl state via e.key on keydown/keyup.
(function () {
    var ctrl = false;

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Control') ctrl = true;
    });

    document.addEventListener('keyup', function (e) {
        if (e.key === 'Control') ctrl = false;
    });

    window.addEventListener('blur', function () {
        ctrl = false;
    });

    window.modKeys = {
        get ctrl() { return ctrl; }
    };
})();
