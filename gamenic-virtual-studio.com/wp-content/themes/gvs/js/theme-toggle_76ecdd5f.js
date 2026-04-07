/* ================================================
   GAMENIC - Theme Toggle (Dark / Light)
   ================================================ */
(function() {
  const DEFAULT_THEME = 'dark';
  const STORAGE_KEY = 'gamenic_theme';

  function safeGetStoredTheme() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return (value === 'light' || value === 'dark') ? value : '';
    } catch (e) {
      return '';
    }
  }

  function safeSetStoredTheme(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // ignore storage failures
    }
  }

  function getPreferredTheme() {
    const stored = safeGetStoredTheme();
    if (stored) return stored;
    // System preferences are intentionally ignored:
    // theme defaults to dark unless explicitly changed via toggle.
    return DEFAULT_THEME;
  }

  function applyTheme(theme) {
    const isLight = (theme === 'light');
    document.documentElement.classList.toggle('theme-light', isLight);
    document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';
    if (document.body) {
      document.body.classList.toggle('theme-light', isLight);
      document.body.style.colorScheme = isLight ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
  }

  function getThemeIconMarkup(currentTheme) {
    if (currentTheme === 'light') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56"></path></svg>';
    }

    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3a8.5 8.5 0 1 0 8 11.3A7.2 7.2 0 0 1 13 3z"></path><path d="M17.8 3.6v2.4M16.6 4.8H19"></path></svg>';
  }

  function updateThemeToggleButton(button, currentTheme) {
    const icon = button.querySelector('.theme-toggle-icon');
    if (icon) {
      icon.innerHTML = getThemeIconMarkup(currentTheme);
    }
    button.removeAttribute('aria-label');
    button.removeAttribute('title');
    button.dataset.currentTheme = currentTheme;
  }

  function bindThemeToggleButton(button) {
    if (!button || button.dataset.themeToggleBound === '1') return;

    button.addEventListener('click', () => {
      const current = (document.body && document.body.classList.contains('theme-light')) ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      safeSetStoredTheme(next);
      syncButtonsWithTheme(next);
    });

    button.dataset.themeToggleBound = '1';
  }

  function ensureThemeToggleButtons() {
    const wraps = document.querySelectorAll('.navbar .nav-cta-wrap');
    wraps.forEach(wrap => {
      let toggle = wrap.querySelector('.theme-toggle');
      if (!toggle) {
        const contactButton = wrap.querySelector('.nav-cta');
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'theme-toggle';
        toggle.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true"></span>';
        toggle.removeAttribute('aria-label');
        toggle.removeAttribute('title');

        if (contactButton) {
          wrap.insertBefore(toggle, contactButton);
        } else {
          wrap.appendChild(toggle);
        }
      }
    });

    document.querySelectorAll('.theme-toggle').forEach(bindThemeToggleButton);
  }

  function syncButtonsWithTheme(theme) {
    const buttons = document.querySelectorAll('.theme-toggle');
    buttons.forEach(button => updateThemeToggleButton(button, theme));
  }

  function initThemeToggle() {
    const theme = getPreferredTheme();
    applyTheme(theme);
    ensureThemeToggleButtons();
    syncButtonsWithTheme(theme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
  } else {
    initThemeToggle();
  }

  window.addEventListener('pageshow', () => {
    const theme = getPreferredTheme();
    applyTheme(theme);
    ensureThemeToggleButtons();
    syncButtonsWithTheme(theme);
  });
})();
