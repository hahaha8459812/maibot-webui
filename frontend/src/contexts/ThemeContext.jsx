import React, { createContext, useState, useContext, useMemo } from 'react';
import { theme as antdTheme } from 'antd';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const themeConfig = useMemo(() => ({
    algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  }), [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
};