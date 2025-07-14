"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ColorTheme = 'default' | 'blue' | 'green' | 'purple' | 'pink';

interface ColorThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  getThemeColors: () => ThemeColors;
}

interface ThemeColors {
  background: string; // HSL
  backgroundForeground: string; // HSL
  card: string; // HSL
  cardForeground: string; // HSL
  primary: string; // HSL
  primaryForeground: string; // HSL
  accent: string; // HSL
  accentForeground: string; // HSL
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

const colorThemes: Record<ColorTheme, { light: ThemeColors; dark: ThemeColors }> = {
  default: {
    light: {
      background: '0 0% 100%', // branco
      backgroundForeground: '0 0% 3.9%', // quase preto
      card: '0 0% 100%', // branco
      cardForeground: '0 0% 3.9%', // quase preto
      primary: '191 100% 42%', // #00bcd4
      primaryForeground: '0 0% 100%', // branco
      accent: '54 100% 50%', // #ffeb3b
      accentForeground: '0 0% 0%', // preto
    },
    dark: {
      background: '0 0% 3.9%', // bem escuro
      backgroundForeground: '0 0% 98%', // quase branco
      card: '0 0% 10%', // escuro
      cardForeground: '0 0% 98%', // quase branco
      primary: '191 100% 42%', // #00bcd4
      primaryForeground: '0 0% 100%', // branco
      accent: '54 100% 50%', // #ffeb3b
      accentForeground: '0 0% 0%', // preto
    },
  },
  blue: {
    light: {
      background: '217 100% 97%', // azul bem claro
      backgroundForeground: '217 71% 20%',
      card: '217 100% 94%', // azul claro
      cardForeground: '217 71% 20%',
      primary: '217 71% 47%', // azul vibrante
      primaryForeground: '0 0% 100%',
      accent: '36 100% 50%', // laranja
      accentForeground: '0 0% 0%',
    },
    dark: {
      background: '217 71% 15%', // azul escuro
      backgroundForeground: '0 0% 100%',
      card: '217 71% 22%', // azul menos escuro
      cardForeground: '0 0% 100%',
      primary: '217 71% 47%',
      primaryForeground: '0 0% 100%',
      accent: '36 100% 50%',
      accentForeground: '0 0% 0%',
    },
  },
  green: {
    light: {
      background: '142 44% 96%',
      backgroundForeground: '142 44% 20%',
      card: '142 44% 92%',
      cardForeground: '142 44% 20%',
      primary: '142 44% 40%',
      primaryForeground: '0 0% 100%',
      accent: '14 100% 56%',
      accentForeground: '0 0% 100%',
    },
    dark: {
      background: '142 44% 15%',
      backgroundForeground: '0 0% 100%',
      card: '142 44% 22%',
      cardForeground: '0 0% 100%',
      primary: '142 44% 40%',
      primaryForeground: '0 0% 100%',
      accent: '14 100% 56%',
      accentForeground: '0 0% 100%',
    },
  },
  purple: {
    light: {
      background: '292 48% 97%',
      backgroundForeground: '292 48% 20%',
      card: '292 48% 94%',
      cardForeground: '292 48% 20%',
      primary: '292 48% 42%',
      primaryForeground: '0 0% 100%',
      accent: '340 82% 52%',
      accentForeground: '0 0% 100%',
    },
    dark: {
      background: '292 48% 15%',
      backgroundForeground: '0 0% 100%',
      card: '292 48% 22%',
      cardForeground: '0 0% 100%',
      primary: '292 48% 42%',
      primaryForeground: '0 0% 100%',
      accent: '340 82% 52%',
      accentForeground: '0 0% 100%',
    },
  },
  pink: {
    light: {
      background: '340 82% 97%',
      backgroundForeground: '340 82% 20%',
      card: '340 82% 94%',
      cardForeground: '340 82% 20%',
      primary: '340 82% 52%',
      primaryForeground: '0 0% 100%',
      accent: '292 48% 42%',
      accentForeground: '0 0% 100%',
    },
    dark: {
      background: '340 82% 15%',
      backgroundForeground: '0 0% 100%',
      card: '340 82% 22%',
      cardForeground: '0 0% 100%',
      primary: '340 82% 52%',
      primaryForeground: '0 0% 100%',
      accent: '292 48% 42%',
      accentForeground: '0 0% 100%',
    },
  },
};

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('default');

  useEffect(() => {
    const savedColorTheme = localStorage.getItem('colorTheme') as ColorTheme;
    if (savedColorTheme && colorThemes[savedColorTheme]) {
      setColorThemeState(savedColorTheme);
    }
  }, []);

  // Atualiza as variáveis CSS de acordo com o tema de cor e dark/light
  useEffect(() => {
    const root = window.document.documentElement;
    const updateColors = () => {
      const isDark = root.classList.contains('dark');
      if (colorTheme === 'default') {
        // Remove customizations, volta ao padrão do Tailwind
        root.style.removeProperty('--background');
        root.style.removeProperty('--foreground');
        root.style.removeProperty('--card');
        root.style.removeProperty('--card-foreground');
        root.style.removeProperty('--primary');
        root.style.removeProperty('--primary-foreground');
        root.style.removeProperty('--accent');
        root.style.removeProperty('--accent-foreground');
        root.style.removeProperty('--app-background');
        // (adicione outros tokens se necessário)
        return;
      }
      const colors = colorThemes[colorTheme][isDark ? 'dark' : 'light'];
      // Personalize todas as variáveis principais
      root.style.setProperty('--background', colors.background);
      root.style.setProperty('--foreground', colors.backgroundForeground);
      root.style.setProperty('--card', colors.card);
      root.style.setProperty('--card-foreground', colors.cardForeground);
      root.style.setProperty('--primary', colors.primary);
      root.style.setProperty('--primary-foreground', colors.primaryForeground);
      root.style.setProperty('--accent', colors.accent);
      root.style.setProperty('--accent-foreground', colors.accentForeground);
      root.style.setProperty('--app-background', colors.background);
    };
    updateColors();
    // Observa mudanças na classe do html (dark/light)
    const observer = new MutationObserver(updateColors);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [colorTheme]);

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
    localStorage.setItem('colorTheme', theme);
  };

  const getThemeColors = () => {
    const root = window.document.documentElement;
    const isDark = root.classList.contains('dark');
    return colorThemes[colorTheme][isDark ? 'dark' : 'light'];
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