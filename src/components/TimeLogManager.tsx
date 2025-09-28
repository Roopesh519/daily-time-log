'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Plus, RefreshCw, Copy, Calendar as CalendarIcon, Download, Clock, Edit3, Trash2 } from 'lucide-react';
import { LogEntry } from '@/types';
import LogEntryModal from './LogEntryModal';
import CalendarView from './CalendarView';
import NotificationModal, { NotificationType } from './NotificationModal';
import ConfirmationModal from './ConfirmationModal';
import { DayCardSkeleton, EntrySkeleton } from './LoadingSkeleton';

interface DayLog {
  date: string;
  entries: LogEntry[];
}

interface TimeLogManagerProps {
  logs: DayLog[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onShowNotification: (type: NotificationType, title: string, message: string) => void;
}

export default function TimeLogManager({
  logs,
  selectedDate,
  setSelectedDate,
  isLoading,
  onRefresh,
  onShowNotification
}: TimeLogManagerProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<LogEntry | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [notification, setNotification] = React.useState<{
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
  const [confirmation, setConfirmation] = React.useState<{
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

  const showNotification = React.useCallback((type: NotificationType, title: string, message: string) => {
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

  const copyTimeLogToClipboard = React.useCallback(async () => {
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
            onRefresh();
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

  const handleSyncCalendar = React.useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      });

      if (response.ok) {
        onRefresh();
        showNotification('success', 'Calendar Synced', 'Your calendar has been synced successfully!');
      } else {
        showNotification('error', 'Sync Failed', 'Failed to sync calendar. Make sure you\'re connected to Google.');
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      showNotification('error', 'Sync Failed', 'Failed to sync calendar. Please try again.');
    }
  }, [selectedDate, onRefresh, showNotification]);

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

  const currentLog = logs.find(log => log.date === selectedDate);
  const totalDuration = currentLog ? getTotalDuration(currentLog.entries) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Last 7 Days Section */}
      <div>
        <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Last 7 Days</h2>
        <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
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
                className={`p-2 sm:p-3 lg:p-4 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-center">
                  <div className={`text-xs sm:text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
                    {format(parseISO(log.date), 'EEE')}
                  </div>
                  <div className={`text-sm sm:text-base lg:text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
                    {format(parseISO(log.date), 'd')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                    {log.entries.length} entries
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    {formatDuration(dayDuration)}
                  </div>
                  {/* Mobile: Show only entry count */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:hidden">
                    {log.entries.length}
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>

      {/* Selected Day Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate">
                {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total time: {formatDuration(totalDuration)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleAddEntry}
                className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                title="Add new time entry (Ctrl+N)"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Entry</span>
                <span className="sm:hidden">Add</span>
              </button>
              <button
                onClick={handleSyncCalendar}
                className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                title="Sync with Google Calendar (Ctrl+S)"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Sync Calendar</span>
                <span className="sm:hidden">Sync</span>
              </button>
              <button
                onClick={copyTimeLogToClipboard}
                className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                title="Copy data to clipboard (Ctrl+C)"
              >
                <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Copy Data</span>
                <span className="sm:hidden">Copy</span>
              </button>
              <button
                onClick={() => setIsCalendarOpen(true)}
                className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                title="Open calendar view"
              >
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Calendar</span>
                <span className="sm:hidden">Cal</span>
              </button>
              <button
                onClick={exportAllData}
                className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                title="Export all data to CSV"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export All</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <EntrySkeleton key={index} />
              ))}
            </div>
          ) : currentLog && currentLog.entries.length > 0 ? (
            <div>
              <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                  Time Entries (Chronological Order)
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentLog.entries.length} {currentLog.entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              <div className="space-y-3">
              {currentLog.entries
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((entry, index) => (
                <div
                  key={entry._id || index}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 gap-3 sm:gap-4"
                >
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                          entry.type === 'manual' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                          entry.type === 'manual'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        }`}>
                          {entry.type}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{entry.description}</p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {format(parseISO(entry.startTime), 'h:mm a')} - {format(parseISO(entry.endTime), 'h:mm a')}
                        </span>
                        <span className="ml-2 flex-shrink-0">
                          ({formatDuration(parseISO(entry.endTime).getTime() - parseISO(entry.startTime).getTime())})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 sm:ml-4">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="flex items-center text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors px-2 py-1"
                      title="Edit entry"
                    >
                      <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry._id!)}
                      className="flex items-center text-xs sm:text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors px-2 py-1"
                      title="Delete entry"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">No entries for this day</h3>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                Start tracking your time by adding manual entries or syncing with Google Calendar to automatically import your events.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
                <button
                  onClick={handleAddEntry}
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manual Entry
                </button>
                <button
                  onClick={handleSyncCalendar}
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Calendar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LogEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          setIsModalOpen(false);
          onRefresh();
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
