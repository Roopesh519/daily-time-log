'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, subDays, parseISO } from 'date-fns';
import { Calendar, Plus, LogOut, Clock, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { LogEntry } from '@/types';
import LogEntryModal from '@/components/LogEntryModal';
import CalendarView from '@/components/CalendarView';

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchLogs();
    }
  }, [session]);

  const fetchLogs = async () => {
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
    if (!confirm('Are you sure you want to delete this entry?')) return;

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
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleSyncCalendar = async () => {
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      });

      if (response.ok) {
        fetchLogs();
        alert('Calendar synced successfully!');
      } else {
        alert('Failed to sync calendar. Make sure you\'re connected to Google.');
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      alert('Failed to sync calendar');
    }
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
        {/* Last 7 Days Section */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Last 7 Days</h2>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {logs.map((log, index) => {
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
            })}
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
              <div className="flex space-x-2">
                <button
                  onClick={handleSyncCalendar}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Sync Calendar
                </button>
                <button
                  onClick={handleAddEntry}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Entry
                </button>
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Calendar
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            {currentLog && currentLog.entries.length > 0 ? (
              <div className="space-y-3">
                {currentLog.entries.map((entry, index) => (
                  <div
                    key={entry._id || index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
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
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry._id!)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No entries for this day</h3>
                <p className="text-gray-500 mb-4">Start by adding a manual entry or syncing with Google Calendar</p>
                <button
                  onClick={handleAddEntry}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </button>
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
    </div>
  );
}

