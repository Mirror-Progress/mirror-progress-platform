import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'mirror_progress_theme_session';
const DEFAULT_THEME: ThemeMode = 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isHydrated: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): ThemeMode {
  return DEFAULT_THEME;
}

function readPersistedTheme(): ThemeMode {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return DEFAULT_THEME;
  }

  const storedTheme = window.sessionStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  const currentTheme = document.documentElement.dataset.theme;
  return currentTheme === 'light' ? 'light' : DEFAULT_THEME;
}

function applyTheme(nextTheme: ThemeMode) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme =
    nextTheme === 'light' ? 'light' : 'dark';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(readInitialTheme);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const persistedTheme = readPersistedTheme();
    applyTheme(persistedTheme);
    setThemeState(persistedTheme);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') {
      return;
    }

    applyTheme(theme);
    window.sessionStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, isHydrated]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () =>
        setThemeState((currentTheme) =>
          currentTheme === 'dark' ? 'light' : 'dark'
        ),
      isHydrated,
    }),
    [isHydrated, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }

  return context;
}

export function getThemeInitializationScript() {
  return `
    (function() {
      try {
        var storageKey = '${THEME_STORAGE_KEY}';
        var storedTheme = window.sessionStorage.getItem(storageKey);
        var theme;

        if (storedTheme === 'light' || storedTheme === 'dark') {
          theme = storedTheme;
        } else {
          theme = Math.random() < 0.5 ? 'dark' : 'light';
          window.sessionStorage.setItem(storageKey, theme);
        }

        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark';
      } catch (error) {
        document.documentElement.dataset.theme = '${DEFAULT_THEME}';
        document.documentElement.style.colorScheme = '${DEFAULT_THEME}';
      }
    })();
  `;
}
