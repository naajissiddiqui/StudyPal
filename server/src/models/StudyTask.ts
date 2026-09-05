import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStudyTask extends Document {
  planId: Types.ObjectId;
  userId: Types.ObjectId;
  subjectName: string;
  topic: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24-hour)
  endTime: string; // HH:MM (24-hour)
  duration: number; // in minutes
  title: string;
  description?: string;
  type: 'LEARNING' | 'PRACTICE' | 'REVISION' | 'MOCK_TEST';
  status: 'PENDING' | 'COMPLETED' | 'MISSED' | 'RESCHEDULED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  plannedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  completedAt?: Date;
  rescheduledFromDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudyTaskSchema = new Schema<IStudyTask>(
  {
    planId: { 
      type: Schema.Types.ObjectId, 
      ref: 'StudyPlan', 
      required: true,
      index: true 
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    subjectName: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true, default: 60 },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { 
      type: String, 
      enum: ['LEARNING', 'PRACTICE', 'REVISION', 'MOCK_TEST'], 
      default: 'LEARNING' 
    },
    status: { 
      type: String, 
      enum: ['PENDING', 'COMPLETED', 'MISSED', 'RESCHEDULED'], 
      default: 'PENDING',
      index: true 
    },
    priority: { 
      type: String, 
      enum: ['HIGH', 'MEDIUM', 'LOW'], 
      default: 'MEDIUM' 
    },
    plannedDuration: { type: Number, default: 60 },
    actualDuration: { type: Number },
    completedAt: { type: Date },
    rescheduledFromDate: { type: String }
  },
  {
    timestamps: true
  }
);

// Compound index for fast day and range queries
StudyTaskSchema.index({ userId: 1, date: 1 });
StudyTaskSchema.index({ planId: 1, date: 1 });

export const StudyTask = mongoose.model<IStudyTask>('StudyTask', StudyTaskSchema);
