import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITopic {
  _id?: Types.ObjectId;
  name: string;
  status: 'WEAK' | 'AVERAGE' | 'STRONG' | 'COMPLETED';
}

export interface ISubject {
  _id?: Types.ObjectId;
  name: string;
  examDate: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  confidence: 'WEAK' | 'AVERAGE' | 'STRONG';
  priorityScore?: number;
  topics: ITopic[];
}

export interface IStudyPlan extends Document {
  userId: Types.ObjectId;
  title: string;
  educationLevel?: string;
  examType?: string;
  examStartDate: string;
  examEndDate: string;
  dailyHoursWeekday: number;
  dailyHoursWeekend: number;
  preferredStudyStart: string;
  preferredStudyEnd: string;
  sessionLength: number; // in minutes
  breakDuration: number; // in minutes
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  subjects: ISubject[];
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    name: { type: String, required: true, trim: true },
    status: { 
      type: String, 
      enum: ['WEAK', 'AVERAGE', 'STRONG', 'COMPLETED'], 
      default: 'AVERAGE' 
    }
  },
  { _id: true }
);

const SubjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, trim: true },
    examDate: { type: String, required: true },
    difficulty: { 
      type: String, 
      enum: ['EASY', 'MEDIUM', 'HARD'], 
      default: 'MEDIUM' 
    },
    confidence: { 
      type: String, 
      enum: ['WEAK', 'AVERAGE', 'STRONG'], 
      default: 'AVERAGE' 
    },
    priorityScore: { type: Number, default: 1 },
    topics: [TopicSchema]
  },
  { _id: true }
);

const StudyPlanSchema = new Schema<IStudyPlan>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    title: { type: String, required: true, trim: true },
    educationLevel: { type: String, default: 'Undergraduate' },
    examType: { type: String, default: 'Semester Finals' },
    examStartDate: { type: String, required: true },
    examEndDate: { type: String, required: true },
    dailyHoursWeekday: { type: Number, default: 3 },
    dailyHoursWeekend: { type: Number, default: 5 },
    preferredStudyStart: { type: String, default: '09:00' },
    preferredStudyEnd: { type: String, default: '21:00' },
    sessionLength: { type: Number, default: 60 },
    breakDuration: { type: Number, default: 15 },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'COMPLETED', 'ARCHIVED'], 
      default: 'ACTIVE',
      index: true 
    },
    subjects: [SubjectSchema]
  },
  {
    timestamps: true
  }
);

export const StudyPlan = mongoose.model<IStudyPlan>('StudyPlan', StudyPlanSchema);
