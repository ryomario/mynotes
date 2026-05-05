(function() {
  try {
    var settings = JSON.parse(localStorage.getItem('mynotes_settings') || '{}');
    var isDark = settings.darkMode !== undefined ? settings.darkMode : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!isDark) {
      document.documentElement.classList.add('light-mode');
    }
    if (settings.fontSize) {
      document.documentElement.style.setProperty('--editor-font-size', settings.fontSize + 'px');
    }
    if (settings.fontFamily) {
      var font = settings.fontFamily === 'Serif' ? 'Georgia, serif' :
                 settings.fontFamily === 'Mono' ? 'monospace' :
                 "'Inter', sans-serif";
      document.documentElement.style.setProperty('--editor-font-family', font);
    }
    if (settings.color) {
      document.documentElement.style.setProperty('--editor-text-color', settings.color);
    }
  } catch (e) {}
})();
