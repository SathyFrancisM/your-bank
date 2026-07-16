import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UiContext = createContext(null);

export const UiProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => sessionStorage.getItem('bank_theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    sessionStorage.setItem('bank_theme', theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }), [theme]);

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
};

export const useUi = () => useContext(UiContext);
