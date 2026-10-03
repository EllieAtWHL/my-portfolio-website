// Light/dark theme, shared with the main EllieAtWHL site. Same origin, same
// localStorage key and the same `light`/`dark` class on <html> as
// public/theme-script.js, so a theme picked on the main site carries over to
// Bobbin and vice versa. index.html applies it inline before first paint
// (avoiding a flash); this module handles the toggle and system changes.

export type Theme = "light" | "dark";
export const THEME_KEY = "theme";

export function storedTheme(storage: Pick<Storage, "getItem"> | undefined = safeStorage()): Theme | null {
  try {
    const v = storage?.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

export function systemTheme(): Theme {
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function currentTheme(): Theme {
  return storedTheme() ?? systemTheme();
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

/** Flips the theme and remembers the choice for the whole site. */
export function toggleTheme(): Theme {
  const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
  try {
    safeStorage()?.setItem(THEME_KEY, next);
  } catch {
    // Storage blocked: the toggle still works for this visit.
  }
  applyTheme(next);
  return next;
}

/** Follow the system setting while the visitor hasn't chosen one. */
export function watchSystemTheme(onChange: (t: Theme) => void): void {
  if (typeof matchMedia !== "function") return;
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (storedTheme()) return;
    const t = systemTheme();
    applyTheme(t);
    onChange(t);
  });
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
