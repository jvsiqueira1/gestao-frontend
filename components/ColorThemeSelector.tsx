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
    primaryColor: '#00bcd4',
    accentColor: '#ffeb3b',
    backgroundLight: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)',
    backgroundDark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
  },
  {
    id: 'blue',
    name: 'Azul',
    primaryColor: '#1976d2',
    accentColor: '#ff9800',
    backgroundLight: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #e3f2fd 100%)',
    backgroundDark: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #0d47a1 100%)',
  },
  {
    id: 'green',
    name: 'Verde',
    primaryColor: '#388e3c',
    accentColor: '#ff5722',
    backgroundLight: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 50%, #e8f5e8 100%)',
    backgroundDark: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #1b5e20 100%)',
  },
  {
    id: 'purple',
    name: 'Roxo',
    primaryColor: '#9c27b0',
    accentColor: '#e91e63',
    backgroundLight: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 50%, #f3e5f5 100%)',
    backgroundDark: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 50%, #4a148c 100%)',
  },
  {
    id: 'pink',
    name: 'Rosa',
    primaryColor: '#e91e63',
    accentColor: '#9c27b0',
    backgroundLight: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 50%, #fce4ec 100%)',
    backgroundDark: 'linear-gradient(135deg, #880e4f 0%, #c2185b 50%, #880e4f 100%)',
  }
];

export default function ColorThemeSelector() {
  const { colorTheme, setColorTheme } = useColorTheme();
  const { theme: currentTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Personalizar Cores do App
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Escolha as cores que mais combinam com seu estilo. As mudanças são aplicadas instantaneamente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
      className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="space-y-3">
        {/* Preview do background */}
        <div className="h-16 rounded-md overflow-hidden relative">
          <div 
            className="w-full h-full"
            style={{ 
              background: currentTheme === 'dark' ? option.backgroundDark : option.backgroundLight 
            }}
          />
        </div>
        
        {/* Nome e cores */}
        <div className="text-center">
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">{option.name}</h5>
          <div className="flex justify-center space-x-2">
            <div
              className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
              style={{ backgroundColor: option.primaryColor }}
            />
            <div
              className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
              style={{ backgroundColor: option.accentColor }}
            />
          </div>
        </div>

        {/* Indicador de seleção */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
} 