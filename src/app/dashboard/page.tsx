'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, subDays, parseISO } from 'date-fns';
import { Calendar, LogOut, HelpCircle } from 'lucide-react';
import { ThemeToggleCompact } from '@/components/ThemeToggle';
import TabNavigation from '@/components/TabNavigation';
import DashboardStats from '@/components/DashboardStats';
import TimeLogManager from '@/components/TimeLogManager';
import NotificationModal, { NotificationType } from '@/components/NotificationModal';
import { LogEntry } from '@/types';

interface DayLog {
  date: string;
  entries: LogEntry[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timelog'>('dashboard');
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });
  const [showShortcuts, setShowShortcuts] = useState(false);

  const showNotification = useCallback((type: NotificationType, title: string, message: string) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
    });
  }, []);

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);


  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/logs?days=7');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchLogs();
    }
  }, [session, fetchLogs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + 1: Switch to Dashboard tab
      if ((event.ctrlKey || event.metaKey) && event.key === '1') {
        event.preventDefault();
        setActiveTab('dashboard');
      }
      // Ctrl/Cmd + 2: Switch to Time Log tab
      if ((event.ctrlKey || event.metaKey) && event.key === '2') {
        event.preventDefault();
        setActiveTab('timelog');
      }
      // Escape: Close notification
      if (event.key === 'Escape') {
        if (notification.isOpen) closeNotification();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [notification.isOpen]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0 flex-1">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">Daily Time Log</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
              <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300 truncate max-w-32 lg:max-w-none">
                Welcome, {session.user?.name}
              </span>
              <ThemeToggleCompact />
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 sm:p-2"
                title="Keyboard shortcuts"
              >
                <HelpCircle className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Help</span>
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 sm:p-2"
                title="Sign out"
              >
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Keyboard Shortcuts Panel */}
        {showShortcuts && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-medium text-blue-900 dark:text-blue-100">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 p-1"
              >
                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 text-xs font-mono mr-2 sm:mr-3 flex-shrink-0">Ctrl+1</kbd>
                  <span className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm">Switch to Dashboard</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 text-xs font-mono mr-2 sm:mr-3 flex-shrink-0">Ctrl+2</kbd>
                  <span className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm">Switch to Time Log</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 text-xs font-mono mr-2 sm:mr-3 flex-shrink-0">Esc</kbd>
                  <span className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm">Close notifications</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-6 sm:mt-8">
          {activeTab === 'dashboard' ? (
            <DashboardStats logs={logs} isLoading={isLoading} />
          ) : (
            <TimeLogManager
              logs={logs}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              isLoading={isLoading}
              onRefresh={fetchLogs}
              onShowNotification={showNotification}
            />
          )}
        </div>

      </div>

      {/* Global Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}

