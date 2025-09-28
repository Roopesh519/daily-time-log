export interface User {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  googleAuthTokens?: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LogEntry {
  _id?: string;
  type: 'manual' | 'calendar';
  startTime: string; // ISO string
  endTime: string; // ISO string
  title: string;
  description: string;
  sourceId?: string; // For calendar sync reference
}

export interface Log {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  entries: LogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

