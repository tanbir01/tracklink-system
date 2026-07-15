import { useContext } from 'react';
import { Moon, Sun } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl
                  bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600
                  transition-all duration-300 group ${className}`}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun
        size={18}
        className={`absolute transition-all duration-300 text-amber-500
                    ${darkMode ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
      />
      <Moon
        size={18}
        className={`absolute transition-all duration-300 text-primary-400
                    ${darkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
      />
    </button>
  );
}
