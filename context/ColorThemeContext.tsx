"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ColorTheme = 'default' | 'blue' | 'green' | 'purple' | 'pink';

interface ColorThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  getThemeColors: () => ThemeColors;
}

interface ThemeColors {
  primary: string;
  accent: string;
  backgroundLight: string;
  backgroundDark: string;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

const colorThemes: Record<ColorTheme, ThemeColors> = {
  default: {
    primary: '#00bcd4',
    accent: '#ffeb3b',
    backgroundLight: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)',
    backgroundDark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
  },
  blue: {
    primary: '#1976d2',
    accent: '#ff9800',
    backgroundLight: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #e3f2fd 100%)',
    backgroundDark: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #0d47a1 100%)',
  },
  green: {
    primary: '#388e3c',
    accent: '#ff5722',
    backgroundLight: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 50%, #e8f5e8 100%)',
    backgroundDark: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #1b5e20 100%)',
  },
  purple: {
    primary: '#9c27b0',
    accent: '#e91e63',
    backgroundLight: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 50%, #f3e5f5 100%)',
    backgroundDark: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 50%, #4a148c 100%)',
  },
  pink: {
    primary: '#e91e63',
    accent: '#9c27b0',
    backgroundLight: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 50%, #fce4ec 100%)',
    backgroundDark: 'linear-gradient(135deg, #880e4f 0%, #c2185b 50%, #880e4f 100%)',
  },
};

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('default');

  useEffect(() => {
    // Verificar se há tema de cor salvo no localStorage
    const savedColorTheme = localStorage.getItem('colorTheme') as ColorTheme;
    if (savedColorTheme && colorThemes[savedColorTheme]) {
      setColorThemeState(savedColorTheme);
    }
  }, []);

  useEffect(() => {
    // Aplicar cores ao documento via CSS custom properties
    const root = window.document.documentElement;
    const colors = colorThemes[colorTheme];
    
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background-light', colors.backgroundLight);
    root.style.setProperty('--color-background-dark', colors.backgroundDark);
    
    localStorage.setItem('colorTheme', colorTheme);
  }, [colorTheme]);

  // Escutar mudanças no tema
  useEffect(() => {
    const handleThemeChange = () => {
      // Reaplicar cores quando o tema mudar
      const root = window.document.documentElement;
      const colors = colorThemes[colorTheme];
      
      root.style.setProperty('--color-primary', colors.primary);
      root.style.setProperty('--color-accent', colors.accent);
      root.style.setProperty('--color-background-light', colors.backgroundLight);
      root.style.setProperty('--color-background-dark', colors.backgroundDark);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, [colorTheme]);

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
  };

  const getThemeColors = () => {
    return colorThemes[colorTheme];
  };

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, getThemeColors }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
} 