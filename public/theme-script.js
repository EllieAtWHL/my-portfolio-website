(function() {
  function getSystemPreference() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  function getStoredTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (e) {
      return null;
    }
  }
  
  function applyTheme() {
    const stored = getStoredTheme();
    const systemPreference = getSystemPreference();
    const isDark = stored === 'dark' || (!stored && systemPreference);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    
    // Remove the loading attribute to show content
    document.documentElement.removeAttribute('data-theme-loading');
  }
  
  // Apply theme immediately before React loads
  applyTheme();
})();
