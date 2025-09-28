'use client';

import React from 'react';
import { BarChart3, Clock } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'dashboard' | 'timelog';
  onTabChange: (tab: 'dashboard' | 'timelog') => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: BarChart3,
      description: 'View statistics and insights'
    },
    {
      id: 'timelog' as const,
      label: 'Time Log',
      icon: Clock,
      description: 'Manage time entries'
    }
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors
                ${isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              title={tab.description}
            >
              <Icon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
