import mongoose, { Schema, Document } from 'mongoose';

export interface ILogEntry {
  type: 'manual' | 'calendar';
  startTime: string; // ISO string
  endTime: string; // ISO string
  title: string;
  description: string;
  sourceId?: string; // For calendar sync reference
}

export interface ILog extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  entries: ILogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const LogEntrySchema = new Schema<ILogEntry>({
  type: {
    type: String,
    enum: ['manual', 'calendar'],
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  sourceId: {
    type: String,
  },
});

const LogSchema = new Schema<ILog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD format
  },
  entries: [LogEntrySchema],
}, {
  timestamps: true,
});

// Compound index for efficient queries
LogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Log || mongoose.model<ILog>('Log', LogSchema);

