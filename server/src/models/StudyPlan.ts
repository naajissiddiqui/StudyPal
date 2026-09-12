import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITopic {
  _id?: Types.ObjectId;
  name: string;
  status: 'WEAK' | 'AVERAGE' | 'STRONG' | 'COMPLETED';
  unitName?: string;
  subtopics?: string[];
  keyConcepts?: string[];
}

export interface ISyllabusTopic {
  name: string;
  subtopics?: string[];
  keyConcepts?: string[];
}

export interface ISyllabusUnit {
  name: string;
  topics: ISyllabusTopic[];
}

export interface ISyllabusSubject {
  name: string;
  overview?: string;
  units: ISyllabusUnit[];
}

export interface IPlanSyllabus {
  fileName: string;
  uploadedAt: Date;
  rawTextLength?: number;
  subjects: ISyllabusSubject[];
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
  syllabus?: IPlanSyllabus;
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
    },
    unitName: { type: String, trim: true },
    subtopics: [{ type: String, trim: true }],
    keyConcepts: [{ type: String, trim: true }]
  },
  { _id: true }
);

const SyllabusTopicSchema = new Schema<ISyllabusTopic>(
  {
    name: { type: String, required: true, trim: true },
    subtopics: [{ type: String, trim: true }],
    keyConcepts: [{ type: String, trim: true }]
  },
  { _id: false }
);

const SyllabusUnitSchema = new Schema<ISyllabusUnit>(
  {
    name: { type: String, required: true, trim: true },
    topics: [SyllabusTopicSchema]
  },
  { _id: false }
);

const SyllabusSubjectSchema = new Schema<ISyllabusSubject>(
  {
    name: { type: String, required: true, trim: true },
    overview: { type: String, trim: true },
    units: [SyllabusUnitSchema]
  },
  { _id: false }
);

const PlanSyllabusSchema = new Schema<IPlanSyllabus>(
  {
    fileName: { type: String, required: true, trim: true },
    uploadedAt: { type: Date, default: Date.now },
    rawTextLength: { type: Number },
    subjects: [SyllabusSubjectSchema]
  },
  { _id: false }
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
    subjects: [SubjectSchema],
    syllabus: { type: PlanSyllabusSchema, required: false }
  },
  {
    timestamps: true
  }
);

export const StudyPlan = mongoose.model<IStudyPlan>('StudyPlan', StudyPlanSchema);

