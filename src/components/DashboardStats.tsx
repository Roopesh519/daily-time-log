'use client';

import React from 'react';
import { Clock, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { LogEntry } from '@/types';
import { format, parseISO } from 'date-fns';

interface DayLog {
  date: string;
  entries: LogEntry[];
}

interface DashboardStatsProps {
  logs: DayLog[];
  isLoading: boolean;
}

export default function DashboardStats({ logs, isLoading }: DashboardStatsProps) {
  const getStatistics = () => {
    const totalEntries = logs.reduce((acc, log) => acc + log.entries.length, 0);
    const totalDuration = logs.reduce((acc, log) => acc + getTotalDuration(log.entries), 0);
    const manualEntries = logs.reduce((acc, log) => 
      acc + log.entries.filter(entry => entry.type === 'manual').length, 0
    );
    const calendarEntries = logs.reduce((acc, log) => 
      acc + log.entries.filter(entry => entry.type === 'calendar').length, 0
    );
    const averageDuration = logs.length > 0 ? totalDuration / logs.length : 0;
    const mostProductiveDay = logs.reduce((max, log) => 
      getTotalDuration(log.entries) > getTotalDuration(max.entries) ? log : max, 
      logs[0] || { entries: [], date: '' }
    );

    return {
      totalEntries,
      totalDuration,
      manualEntries,
      calendarEntries,
      averageDuration,
      mostProductiveDay,
      daysTracked: logs.length
    };
  };

  const getTotalDuration = (entries: LogEntry[]) => {
    return entries.reduce((total, entry) => {
      const start = parseISO(entry.startTime);
      const end = parseISO(entry.endTime);
      return total + (end.getTime() - start.getTime());
    }, 0);
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 h-20"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">No data yet</h3>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto px-4">
          Start tracking your time to see productivity insights and statistics here.
        </p>
      </div>
    );
  }

  const stats = getStatistics();

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
          Productivity Insights
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Time</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white truncate">{formatDuration(stats.totalDuration)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Entries</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalEntries}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Days Tracked</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">{stats.daysTracked}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Avg/Day</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white truncate">{formatDuration(stats.averageDuration)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 sm:mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3">Entry Types</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Manual Entries</span>
                <span className="text-sm font-medium text-green-600">{stats.manualEntries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Calendar Entries</span>
                <span className="text-sm font-medium text-blue-600">{stats.calendarEntries}</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3">Most Productive Day</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="truncate">{stats.mostProductiveDay.date ? format(parseISO(stats.mostProductiveDay.date), 'EEEE, MMMM d, yyyy') : 'No data'}</p>
              <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mt-1">
                {stats.mostProductiveDay.date ? formatDuration(getTotalDuration(stats.mostProductiveDay.entries)) : '0h 0m'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
