'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Clock, Calendar, FileText, Type, Save, XCircle } from 'lucide-react';
import { LogEntry } from '@/types';
import { format, parseISO } from 'date-fns';

const logEntrySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
}).refine((data) => {
  const start = parseISO(data.startTime);
  const end = parseISO(data.endTime);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type LogEntryForm = z.infer<typeof logEntrySchema>;

interface LogEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  date: string;
  entry?: LogEntry | null;
}

export default function LogEntryModal({ isOpen, onClose, onSave, date, entry }: LogEntryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LogEntryForm>({
    resolver: zodResolver(logEntrySchema),
    defaultValues: {
      title: '',
      description: '',
      startTime: '',
      endTime: '',
    },
  });

  useEffect(() => {
    if (entry) {
      reset({
        title: entry.title,
        description: entry.description,
        startTime: entry.startTime,
        endTime: entry.endTime,
      });
    } else {
      reset({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
      });
    }
  }, [entry, reset]);

  const onSubmit = async (data: LogEntryForm) => {
    setIsLoading(true);
    setError('');

    try {
      // Get current log entries
      const response = await fetch(`/api/logs/${date}`);
      const currentLog = await response.json();
      const entries = currentLog.entries || [];

      let updatedEntries;
      if (entry) {
        // Update existing entry
        updatedEntries = entries.map((e: LogEntry) => 
          e._id === entry._id 
            ? { ...e, ...data, type: 'manual' as const }
            : e
        );
      } else {
        // Add new entry
        const newEntry: LogEntry = {
          ...data,
          description: data.description || '',
          type: 'manual',
        };
        updatedEntries = [...entries, newEntry];
      }

      // Save updated entries
      const saveResponse = await fetch(`/api/logs/${date}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: updatedEntries }),
      });

      if (saveResponse.ok) {
        onSave();
      } else {
        setError('Failed to save entry');
      }
    } catch (error) {
      setError('An error occurred while saving');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-3 sm:px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full w-full mx-3 sm:mx-0">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                  {entry ? 'Edit Entry' : 'Add New Entry'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Type className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      {...register('title')}
                      type="text"
                      className="appearance-none relative block w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter entry title"
                    />
                  </div>
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="appearance-none relative block w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter entry description (optional)"
                    />
                  </div>
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Time
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        {...register('startTime')}
                        type="datetime-local"
                        className="appearance-none relative block w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    {errors.startTime && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startTime.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      End Time
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        {...register('endTime')}
                        type="datetime-local"
                        className="appearance-none relative block w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    {errors.endTime && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endTime.message}</p>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : (entry ? 'Update Entry' : 'Add Entry')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center items-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

