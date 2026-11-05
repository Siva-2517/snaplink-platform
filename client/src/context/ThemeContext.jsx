/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const saved = localStorage.getItem('snaplink-theme');
    if (saved) return saved;

    const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return userPrefersDark ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
    localStorage.setItem('snaplink-theme', theme);
  }, [theme]);

  // Listen to system preference changes if no manual override is set
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const saved = localStorage.getItem('snaplink-theme');
      if (!saved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme,
          primary: {
            main: '#5f5dec',
            dark: '#4e4be3',
          },
          secondary: {
            main: '#8b5cf6',
          },
          error: {
            main: '#ef4444',
          },
          success: {
            main: '#10b981',
          },
          background: {
            default: theme === 'dark' ? '#06060a' : '#f8fafc',
            paper: theme === 'dark' ? 'rgba(13, 13, 20, 0.9)' : '#ffffff',
          },
          text: {
            primary: theme === 'dark' ? '#f4f4f6' : '#0f172a',
            secondary: theme === 'dark' ? '#94a3b8' : '#64748b',
          },
        },
        typography: {
          fontFamily: "'Inter', system-ui, sans-serif",
          h1: { fontFamily: "'Outfit', sans-serif" },
          h2: { fontFamily: "'Outfit', sans-serif" },
          h3: { fontFamily: "'Outfit', sans-serif" },
          h4: { fontFamily: "'Outfit', sans-serif" },
          h5: { fontFamily: "'Outfit', sans-serif" },
          h6: { fontFamily: "'Outfit', sans-serif" },
        },
        shape: {
          borderRadius: 10,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 8,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
        },
      }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

