'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, subDays, parseISO } from 'date-fns';
import { Calendar, Plus, LogOut, Clock, Calendar as CalendarIcon, RefreshCw, Copy, HelpCircle, Download, TrendingUp, BarChart3, Edit3, Trash2 } from 'lucide-react';
import { LogEntry } from '@/types';
import LogEntryModal from '@/components/LogEntryModal';
import CalendarView from '@/components/CalendarView';
import NotificationModal, { NotificationType } from '@/components/NotificationModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DayCardSkeleton, EntrySkeleton } from '@/components/LoadingSkeleton';

interface DayLog {
  date: string;
  entries: LogEntry[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
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

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmation({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const closeConfirmation = () => {
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  };

  const copyTimeLogToClipboard = useCallback(async () => {
    const currentLog = logs.find(log => log.date === selectedDate);
    
    if (!currentLog || currentLog.entries.length === 0) {
      showNotification('warning', 'No Data', 'No time entries found for this day.');
      return;
    }

    // Sort entries by start time
    const sortedEntries = currentLog.entries.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Create formatted text for spreadsheet pasting
    const formattedData = [
      // Header row
      ['Date', 'Start Time', 'End Time', 'Duration', 'Title', 'Description', 'Type'],
      // Data rows
      ...sortedEntries.map(entry => {
        const startTime = parseISO(entry.startTime);
        const endTime = parseISO(entry.endTime);
        const duration = endTime.getTime() - startTime.getTime();
        
        return [
          format(parseISO(selectedDate), 'yyyy-MM-dd'), // Date
          format(startTime, 'HH:mm'), // Start time (24-hour format)
          format(endTime, 'HH:mm'), // End time (24-hour format)
          formatDuration(duration), // Duration
          entry.title, // Title
          entry.description || '', // Description
          entry.type // Type (manual/calendar)
        ];
      })
    ];

    // Convert to tab-separated values for easy pasting into spreadsheets
    const tsvData = formattedData.map(row => row.join('\t')).join('\n');
    
    try {
      await navigator.clipboard.writeText(tsvData);
      showNotification('success', 'Copied!', 'Time log copied to clipboard. Ready to paste into spreadsheet!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showNotification('error', 'Copy Failed', 'Failed to copy to clipboard. Please try again.');
    }
  }, [logs, selectedDate, showNotification]);

  const exportAllData = () => {
    if (logs.length === 0) {
      showNotification('warning', 'No Data', 'No time logs found to export.');
      return;
    }

    // Create comprehensive export data
    const exportData = logs.map(log => {
      const sortedEntries = log.entries.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      return sortedEntries.map(entry => {
        const startTime = parseISO(entry.startTime);
        const endTime = parseISO(entry.endTime);
        const duration = endTime.getTime() - startTime.getTime();
        
        return {
          Date: format(parseISO(log.date), 'yyyy-MM-dd'),
          'Start Time': format(startTime, 'HH:mm'),
          'End Time': format(endTime, 'HH:mm'),
          Duration: formatDuration(duration),
          Title: entry.title,
          Description: entry.description || '',
          Type: entry.type,
          'Day of Week': format(parseISO(log.date), 'EEEE'),
          'Week Number': format(parseISO(log.date), 'w'),
          'Month': format(parseISO(log.date), 'MMMM'),
          'Year': format(parseISO(log.date), 'yyyy')
        };
      });
    }).flat();

    // Convert to CSV format
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `time-log-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('success', 'Export Complete', 'All time log data has been exported to CSV file.');
  };

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

  const handleAddEntry = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry: LogEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    showConfirmation(
      'Delete Entry',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      async () => {
        try {
          const log = logs.find(l => l.date === selectedDate);
          if (!log) return;

          const updatedEntries = log.entries.filter(entry => entry._id !== entryId);
          
          const response = await fetch(`/api/logs/${selectedDate}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: updatedEntries }),
          });

          if (response.ok) {
            fetchLogs();
            showNotification('success', 'Entry Deleted', 'The entry has been deleted successfully.');
          } else {
            showNotification('error', 'Delete Failed', 'Failed to delete the entry. Please try again.');
          }
        } catch (error) {
          console.error('Error deleting entry:', error);
          showNotification('error', 'Delete Failed', 'An error occurred while deleting the entry.');
        }
        closeConfirmation();
      }
    );
  };

  const handleSyncCalendar = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      });

      if (response.ok) {
        fetchLogs();
        showNotification('success', 'Calendar Synced', 'Your calendar has been synced successfully!');
      } else {
        showNotification('error', 'Sync Failed', 'Failed to sync calendar. Make sure you\'re connected to Google.');
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      showNotification('error', 'Sync Failed', 'Failed to sync calendar. Please try again.');
    }
  }, [selectedDate, fetchLogs, showNotification]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + N: Add new entry
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        handleAddEntry();
      }
      // Ctrl/Cmd + S: Sync calendar
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSyncCalendar();
      }
      // Ctrl/Cmd + C: Copy data
      if ((event.ctrlKey || event.metaKey) && event.key === 'c' && (!event.target || (event.target as HTMLElement).tagName !== 'INPUT')) {
        event.preventDefault();
        copyTimeLogToClipboard();
      }
      // Escape: Close modals
      if (event.key === 'Escape') {
        if (isModalOpen) setIsModalOpen(false);
        if (isCalendarOpen) setIsCalendarOpen(false);
        if (notification.isOpen) closeNotification();
        if (confirmation.isOpen) closeConfirmation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isCalendarOpen, notification.isOpen, confirmation.isOpen, copyTimeLogToClipboard, handleSyncCalendar]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const currentLog = logs.find(log => log.date === selectedDate);
  const totalDuration = currentLog ? getTotalDuration(currentLog.entries) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Daily Time Log</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {session.user?.name}</span>
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                title="Keyboard shortcuts"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Help
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Keyboard Shortcuts Panel */}
        {showShortcuts && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-blue-900">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-xs font-mono mr-3">Ctrl+N</kbd>
                  <span className="text-blue-800">Add new entry</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-xs font-mono mr-3">Ctrl+S</kbd>
                  <span className="text-blue-800">Sync calendar</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-xs font-mono mr-3">Ctrl+C</kbd>
                  <span className="text-blue-800">Copy data to clipboard</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-xs font-mono mr-3">Esc</kbd>
                  <span className="text-blue-800">Close modals</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Section */}
        {!isLoading && logs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Productivity Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(() => {
                const stats = getStatistics();
                return (
                  <>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Total Time</p>
                          <p className="text-2xl font-semibold text-gray-900">{formatDuration(stats.totalDuration)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Total Entries</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.totalEntries}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Calendar className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Days Tracked</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.daysTracked}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <BarChart3 className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Avg/Day</p>
                          <p className="text-2xl font-semibold text-gray-900">{formatDuration(stats.averageDuration)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Entry Types</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Manual Entries</span>
                    <span className="text-sm font-medium text-green-600">{getStatistics().manualEntries}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Calendar Entries</span>
                    <span className="text-sm font-medium text-blue-600">{getStatistics().calendarEntries}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Most Productive Day</h3>
                <div className="text-sm text-gray-600">
                  <p>{getStatistics().mostProductiveDay.date ? format(parseISO(getStatistics().mostProductiveDay.date), 'EEEE, MMMM d, yyyy') : 'No data'}</p>
                  <p className="text-lg font-medium text-gray-900 mt-1">
                    {getStatistics().mostProductiveDay.date ? formatDuration(getTotalDuration(getStatistics().mostProductiveDay.entries)) : '0h 0m'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last 7 Days Section */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Last 7 Days</h2>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {isLoading ? (
              Array.from({ length: 7 }).map((_, index) => (
                <DayCardSkeleton key={index} />
              ))
            ) : (
              logs.map((log, index) => {
              const dayDuration = getTotalDuration(log.entries);
              const isToday = log.date === format(new Date(), 'yyyy-MM-dd');
              const isSelected = log.date === selectedDate;
              
              return (
                <div
                  key={log.date}
                  onClick={() => setSelectedDate(log.date)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {format(parseISO(log.date), 'EEE')}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {format(parseISO(log.date), 'd')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {log.entries.length} entries
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDuration(dayDuration)}
                    </div>
                  </div>
                </div>
              );
              })
            )}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
                </h3>
                <p className="text-sm text-gray-500">
                  Total time: {formatDuration(totalDuration)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAddEntry}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                  title="Add new time entry (Ctrl+N)"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </button>
                <button
                  onClick={handleSyncCalendar}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Sync with Google Calendar (Ctrl+S)"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Calendar
                </button>
                <button
                  onClick={copyTimeLogToClipboard}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Copy data to clipboard (Ctrl+C)"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Data
                </button>
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Open calendar view"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendar
                </button>
                <button
                  onClick={exportAllData}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Export all data to CSV"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <EntrySkeleton key={index} />
                ))}
              </div>
            ) : currentLog && currentLog.entries.length > 0 ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Time Entries (Chronological Order)
                  </h3>
                  <span className="text-sm text-gray-500">
                    {currentLog.entries.length} {currentLog.entries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <div className="space-y-3">
                {currentLog.entries
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map((entry, index) => (
                  <div
                    key={entry._id || index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center mr-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          entry.type === 'manual' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <h4 className="text-sm font-medium text-gray-900">{entry.title}</h4>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          entry.type === 'manual'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {entry.type}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-sm text-gray-500 mt-1">{entry.description}</p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(parseISO(entry.startTime), 'h:mm a')} - {format(parseISO(entry.endTime), 'h:mm a')}
                        <span className="ml-2">
                          ({formatDuration(parseISO(entry.endTime).getTime() - parseISO(entry.startTime).getTime())})
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit entry"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry._id!)}
                        className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">No entries for this day</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Start tracking your time by adding manual entries or syncing with Google Calendar to automatically import your events.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleAddEntry}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manual Entry
                  </button>
                  <button
                    onClick={handleSyncCalendar}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Calendar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LogEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          setIsModalOpen(false);
          fetchLogs();
        }}
        date={selectedDate}
        entry={editingEntry}
      />

      <CalendarView
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onDateSelect={(date) => {
          setSelectedDate(date);
          setIsCalendarOpen(false);
        }}
        selectedDate={selectedDate}
      />

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

