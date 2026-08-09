import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { lightTheme, darkTheme } from './themes';

const THEME_MODE_KEY = 'friendmatch_theme_mode';

const ThemeContext = createContext({
  colors: lightTheme,
  mode: 'light',
  setMode: () => {}
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    let mounted = true;

    SecureStore.getItemAsync(THEME_MODE_KEY)
      .then((saved) => {
        if (mounted && (saved === 'light' || saved === 'dark')) {
          setMode(saved);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const updateMode = useCallback((next) => {
    setMode(next);
    SecureStore.setItemAsync(THEME_MODE_KEY, next).catch(() => {});
  }, []);

  const colors = mode === 'dark' ? darkTheme : lightTheme;

  const value = useMemo(() => ({ colors, mode, setMode: updateMode }), [colors, mode, updateMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemedStyles(makeStyles) {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors, makeStyles]);
}
