'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <div className="relative">
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
              ${theme === value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
            title={`Switch to ${label} theme`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemeToggleCompact() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return Monitor;
    }
    return resolvedTheme === 'dark' ? Moon : Sun;
  };

  const Icon = getIcon();

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      title={`Current: ${theme} theme (click to cycle)`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
