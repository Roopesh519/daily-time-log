'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Clock, Calendar, FileText, Type } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {entry ? 'Edit Entry' : 'Add New Entry'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Type className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('title')}
                      type="text"
                      className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter entry title"
                    />
                  </div>
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter entry description (optional)"
                    />
                  </div>
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                      Start Time
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('startTime')}
                        type="datetime-local"
                        className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    {errors.startTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                      End Time
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('endTime')}
                        type="datetime-local"
                        className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    {errors.endTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : (entry ? 'Update Entry' : 'Add Entry')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

