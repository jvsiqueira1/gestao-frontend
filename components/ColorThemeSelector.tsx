"use client";
import { useColorTheme, ColorTheme } from '../context/ColorThemeContext';
import { useTheme } from '../context/ThemeContext';

interface ColorOption {
  id: ColorTheme;
  name: string;
  primaryColor: string;
  accentColor: string;
  backgroundLight: string;
  backgroundDark: string;
}

const colorOptions: ColorOption[] = [
  {
    id: 'default',
    name: 'Padrão',
    primaryColor: '#00bcd4', // ciano original do app
    accentColor: '#ffeb3b',  // amarelo original do app
    backgroundLight: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)',
    backgroundDark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
  },
  {
    id: 'blue',
    name: 'Azul',
    primaryColor: '#1976d2', // azul vibrante
    accentColor: '#ff9800',  // laranja
    backgroundLight: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #e3f2fd 100%)',
    backgroundDark: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #0d47a1 100%)',
  },
  {
    id: 'green',
    name: 'Verde',
    primaryColor: '#388e3c', // verde vibrante
    accentColor: '#ff5722',  // laranja-avermelhado
    backgroundLight: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 50%, #e8f5e8 100%)',
    backgroundDark: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #1b5e20 100%)',
  },
  {
    id: 'purple',
    name: 'Roxo',
    primaryColor: '#9c27b0', // roxo vibrante
    accentColor: '#e91e63',  // rosa vibrante
    backgroundLight: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 50%, #f3e5f5 100%)',
    backgroundDark: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 50%, #4a148c 100%)',
  },
  {
    id: 'pink',
    name: 'Rosa',
    primaryColor: '#e91e63', // rosa vibrante
    accentColor: '#9c27b0',  // roxo vibrante
    backgroundLight: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 50%, #fce4ec 100%)',
    backgroundDark: 'linear-gradient(135deg, #880e4f 0%, #c2185b 50%, #880e4f 100%)',
  }
];

export default function ColorThemeSelector() {
  const { colorTheme, setColorTheme } = useColorTheme();
  const { theme: currentTheme } = useTheme();

  return (
    <div className="flex flex-col gap-3">
      {colorOptions.map((option) => (
        <ColorOptionCard
          key={option.id}
          option={option}
          isSelected={colorTheme === option.id}
          onSelect={() => setColorTheme(option.id)}
          currentTheme={currentTheme}
        />
      ))}
    </div>
  );
}

interface ColorOptionCardProps {
  option: ColorOption;
  isSelected: boolean;
  onSelect: () => void;
  currentTheme: 'light' | 'dark';
}

function ColorOptionCard({ option, isSelected, onSelect, currentTheme }: ColorOptionCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`relative p-3 flex items-center justify-between rounded-lg border-2 transition-all duration-200 min-h-[56px] ${
        isSelected
          ? 'border-primary bg-primary/10 dark:bg-primary/20'
          : 'border-border bg-background hover:border-muted dark:hover:border-muted'
      }`}
    >
      <span className="font-medium text-foreground">{option.name}</span>
      <span className="flex items-center gap-2">
        <span
          className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
          style={{ backgroundColor: option.primaryColor }}
        />
      </span>
      {isSelected && (
        <span className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
    </button>
  );
} 