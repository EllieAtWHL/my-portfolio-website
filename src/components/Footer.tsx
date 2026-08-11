'use client';

import { useTheme } from './ThemeProvider';
import { useCookieConsent } from './CookieConsentProvider';
import { Button } from './Button';

export default function Footer() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { openPreferences } = useCookieConsent();

  return (
    <footer className={`footer ${isDarkMode ? 'dark' : ''}`}>
      <div className="findMe floatLeft">
        <p>
          Find all my socials on{' '}
          <a
            href="https://linktr.ee/EllieAtWHL"
            target="_blank"
            rel="noopener noreferrer"
            className="linktree-link"
          >
            Linktree
          </a>
        </p>
        <p>
          <Button variant="ghost" size="xs" onClick={openPreferences}>
            Cookie preferences
          </Button>
        </p>
      </div>

      <div className="darkMode floatRight">
        <div className="theme-toggle-container">
          <svg className="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
          </svg>

          <label className="switch" htmlFor="darkMode">
            <input
              type="checkbox"
              id="darkMode"
              checked={isDarkMode}
              onChange={toggleDarkMode}
              aria-label="Toggle dark mode"
            />
            <span className="slider round"></span>
          </label>

          <svg className="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </div>
      </div>
    </footer>
  );
}
