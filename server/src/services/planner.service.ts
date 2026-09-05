import { Types } from 'mongoose';
import { StudyPlan, IStudyPlan, ISubject } from '../models/StudyPlan';
import { StudyTask, IStudyTask } from '../models/StudyTask';
import { 
  formatDate, 
  parseDate, 
  addDays, 
  daysBetween, 
  isWeekend, 
  generateDaySlots, 
  timeToMinutes, 
  minutesToTime,
  ITimeSlot 
} from '../utils/dateUtils';
import { aiService } from './ai.service';

export interface CreatePlanInput {
  userId: string;
  title: string;
  educationLevel?: string;
  examType?: string;
  examStartDate: string; // YYYY-MM-DD
  examEndDate: string;   // YYYY-MM-DD
  dailyHoursWeekday: number;
  dailyHoursWeekend: number;
  preferredStudyStart: string; // e.g. "09:00"
  preferredStudyEnd: string;   // e.g. "21:00"
  sessionLength?: number;      // minutes, default 60
  breakDuration?: number;      // minutes, default 15
  subjects: {
    name: string;
    examDate: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    confidence: 'WEAK' | 'AVERAGE' | 'STRONG';
    topics: { name: string; status?: 'WEAK' | 'AVERAGE' | 'STRONG' | 'COMPLETED' }[];
  }[];
}

export class PlannerService {
  /**
   * Calculates subject priority score based on Urgency, Difficulty, and Confidence
   */
  calculateSubjectPriority(subject: {
    examDate: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    confidence: 'WEAK' | 'AVERAGE' | 'STRONG';
  }, planStartDate: string): number {
    const daysUntilExam = Math.max(1, daysBetween(planStartDate, subject.examDate));

    // Urgency factor: fewer days -> higher urgency (100 / days)
    const urgencyFactor = Math.min(10, Math.max(1, 45 / daysUntilExam));

    // Difficulty multiplier: Hard = 1.6, Medium = 1.2, Easy = 0.9
    const difficultyMap = { HARD: 1.6, MEDIUM: 1.2, EASY: 0.9 };
    const difficultyMultiplier = difficultyMap[subject.difficulty] || 1.2;

    // Weakness multiplier: Weak = 1.8, Average = 1.2, Strong = 0.8
    const confidenceMap = { WEAK: 1.8, AVERAGE: 1.2, STRONG: 0.8 };
    const weaknessMultiplier = confidenceMap[subject.confidence] || 1.2;

    // Priority Formula: Urgency × Difficulty × Weakness
    const score = urgencyFactor * difficultyMultiplier * weaknessMultiplier;
    return parseFloat(score.toFixed(2));
  }

  /**
   * Generates a full adaptive study plan with collision-free, prioritized tasks
   */
  async generateStudyPlan(input: CreatePlanInput): Promise<{ plan: IStudyPlan; taskCount: number }> {
    const todayStr = formatDate(new Date());
    const startDateStr = input.examStartDate || todayStr;
    const endDateStr = input.examEndDate;

    // 1. Calculate and rank subjects by Priority Score
    const rankedSubjects = input.subjects.map(s => {
      const priorityScore = this.calculateSubjectPriority(s, startDateStr);
      return {
        ...s,
        priorityScore,
        topics: (s.topics || []).map(t => ({
          name: t.name,
          status: t.status || 'AVERAGE'
        }))
      };
    }).sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    // 2. Create the StudyPlan record
    const plan = await StudyPlan.create({
      userId: new Types.ObjectId(input.userId),
      title: input.title || 'Personalized Exam Study Plan',
      educationLevel: input.educationLevel || 'Undergraduate',
      examType: input.examType || 'Semester Exams',
      examStartDate: startDateStr,
      examEndDate: endDateStr,
      dailyHoursWeekday: input.dailyHoursWeekday || 3,
      dailyHoursWeekend: input.dailyHoursWeekend || 5,
      preferredStudyStart: input.preferredStudyStart || '09:00',
      preferredStudyEnd: input.preferredStudyEnd || '21:00',
      sessionLength: input.sessionLength || 60,
      breakDuration: input.breakDuration || 15,
      status: 'ACTIVE',
      subjects: rankedSubjects
    });

    // 3. Generate daily task schedule
    const totalDays = Math.max(1, daysBetween(startDateStr, endDateStr));
    const generatedTasksToInsert: any[] = [];

    // Flatten all topics with subject metadata and priority
    interface TopicItem {
      subjectName: string;
      examDate: string;
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      confidence: 'WEAK' | 'AVERAGE' | 'STRONG';
      priorityScore: number;
      topicName: string;
      topicStatus: string;
    }

    const topicPool: TopicItem[] = [];
    for (const sub of rankedSubjects) {
      for (const top of sub.topics) {
        topicPool.push({
          subjectName: sub.name,
          examDate: sub.examDate,
          difficulty: sub.difficulty,
          confidence: sub.confidence,
          priorityScore: sub.priorityScore || 1,
          topicName: top.name,
          topicStatus: top.status || 'AVERAGE'
        });
      }
    }

    // Sort topic pool: highest subject priority + weak topics first
    topicPool.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      if (a.topicStatus === 'WEAK' && b.topicStatus !== 'WEAK') return -1;
      if (b.topicStatus === 'WEAK' && a.topicStatus !== 'WEAK') return 1;
      return 0;
    });

    let topicPointer = 0;
    const sessionLength = input.sessionLength || 60;
    const breakDuration = input.breakDuration || 15;

    // Distribute slots across each day from start to end date
    for (let dayOffset = 0; dayOffset <= totalDays; dayOffset++) {
      const currentDateStr = addDays(startDateStr, dayOffset);
      const isWknd = isWeekend(currentDateStr);
      const dailyHours = isWknd ? (input.dailyHoursWeekend || 5) : (input.dailyHoursWeekday || 3);

      const daySlots = generateDaySlots(
        input.preferredStudyStart || '09:00',
        input.preferredStudyEnd || '21:00',
        dailyHours,
        sessionLength,
        breakDuration
      );

      for (let slotIndex = 0; slotIndex < daySlots.length; slotIndex++) {
        const slot = daySlots[slotIndex];

        // Filter available topics whose exam has NOT passed
        const validTopics = topicPool.filter(t => daysBetween(currentDateStr, t.examDate) >= 0);
        if (validTopics.length === 0) continue;

        // Select topic cyclically
        const selectedTopic = validTopics[topicPointer % validTopics.length];
        topicPointer++;

        // Determine Task Phase based on timeline progress
        const daysToExam = daysBetween(currentDateStr, selectedTopic.examDate);
        let taskType: 'LEARNING' | 'PRACTICE' | 'REVISION' | 'MOCK_TEST' = 'LEARNING';
        let priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';

        if (daysToExam <= 2) {
          taskType = 'REVISION';
          priorityLevel = 'HIGH';
        } else if (daysToExam <= 5) {
          taskType = (slotIndex % 2 === 0) ? 'MOCK_TEST' : 'REVISION';
          priorityLevel = 'HIGH';
        } else if (daysToExam <= 12) {
          taskType = (slotIndex % 2 === 0) ? 'PRACTICE' : 'LEARNING';
          priorityLevel = selectedTopic.confidence === 'WEAK' ? 'HIGH' : 'MEDIUM';
        } else {
          taskType = (slotIndex % 3 === 0) ? 'PRACTICE' : 'LEARNING';
          priorityLevel = selectedTopic.confidence === 'WEAK' ? 'HIGH' : 'LOW';
        }

        const taskDetails = await aiService.generateTaskDetails({
          subjectName: selectedTopic.subjectName,
          topic: selectedTopic.topicName,
          type: taskType,
          difficulty: selectedTopic.difficulty,
          confidence: selectedTopic.confidence
        });

        generatedTasksToInsert.push({
          planId: plan._id,
          userId: new Types.ObjectId(input.userId),
          subjectName: selectedTopic.subjectName,
          topic: selectedTopic.topicName,
          date: currentDateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration,
          title: taskDetails.title,
          description: taskDetails.description,
          type: taskType,
          status: 'PENDING',
          priority: priorityLevel,
          plannedDuration: slot.duration
        });
      }
    }

    if (generatedTasksToInsert.length > 0) {
      await StudyTask.insertMany(generatedTasksToInsert);
    }

    return {
      plan,
      taskCount: generatedTasksToInsert.length
    };
  }

  /**
   * Reschedules a missed or pending task without collisions
   */
  async rescheduleTask(
    taskId: string,
    userId: string,
    options: {
      mode: 'TOMORROW' | 'NEXT_SLOT' | 'CUSTOM_DATE';
      targetDate?: string;
      targetStartTime?: string;
    }
  ): Promise<IStudyTask> {
    const task = await StudyTask.findOne({ _id: taskId, userId });
    if (!task) {
      const err: any = new Error('Task not found');
      err.statusCode = 404;
      throw err;
    }

    const plan = await StudyPlan.findById(task.planId);
    const originalDate = task.date;
    let newDate = options.targetDate || addDays(task.date, 1);

    if (options.mode === 'TOMORROW') {
      newDate = addDays(formatDate(new Date()), 1);
    } else if (options.mode === 'NEXT_SLOT') {
      newDate = formatDate(new Date());
    }

    // Get existing tasks on target date to prevent overlap
    const existingTasks = await StudyTask.find({
      userId,
      date: newDate,
      status: { $ne: 'COMPLETED' },
      _id: { $ne: task._id }
    });

    const preferredStart = plan?.preferredStudyStart || '09:00';
    const preferredEnd = plan?.preferredStudyEnd || '21:00';
    const sessionLength = task.duration || plan?.sessionLength || 60;
    const breakDuration = plan?.breakDuration || 15;

    // Find first non-overlapping slot
    const possibleSlots = generateDaySlots(
      preferredStart,
      preferredEnd,
      6,
      sessionLength,
      breakDuration
    );

    let chosenSlot: ITimeSlot = possibleSlots[0] || {
      startTime: task.startTime,
      endTime: task.endTime,
      duration: task.duration
    };

    for (const slot of possibleSlots) {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);

      const hasConflict = existingTasks.some(t => {
        const tStart = timeToMinutes(t.startTime);
        const tEnd = timeToMinutes(t.endTime);
        return (slotStart < tEnd && slotEnd > tStart);
      });

      if (!hasConflict) {
        chosenSlot = slot;
        break;
      }
    }

    task.rescheduledFromDate = originalDate;
    task.date = newDate;
    task.startTime = options.targetStartTime || chosenSlot.startTime;
    task.endTime = minutesToTime(timeToMinutes(task.startTime) + task.duration);
    task.status = 'RESCHEDULED';

    await task.save();
    return task;
  }
}

export const plannerService = new PlannerService();
