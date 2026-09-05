import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/ai.service';
import { StudyPlan } from '../models/StudyPlan';
import { StudyTask } from '../models/StudyTask';
import { formatDate, addDays, getDayOfWeekName } from '../utils/dateUtils';

export class AIController {
  /**
   * POST /api/ai/suggest-topics
   * Generates AI syllabus and high-yield topics for a given subject
   */
  async suggestTopics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { subjectName, gradeLevel, examType, targetGoal } = req.body;

      if (!subjectName || typeof subjectName !== 'string' || subjectName.trim() === '') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Subject name is required' }
        });
        return;
      }

      const result = await aiService.suggestTopicsWithAI({
        subjectName: subjectName.trim(),
        gradeLevel,
        examType,
        targetGoal
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err: any) {
      console.error('[AIController] suggestTopics error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'AI_ERROR', message: err.message || 'Failed to suggest topics' }
      });
    }
  }

  /**
   * POST /api/ai/ask-assistant
   * Contextual chatbot assistant with live student schedule context
   */
  async askAssistant(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { query, planId } = req.body;
      const userId = req.user?.userId;

      if (!query || typeof query !== 'string' || query.trim() === '') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Question query is required' }
        });
        return;
      }

      // Fetch user's active plan and current task state if logged in
      let planTitle = 'Active Study Plan';
      let gradeLevel = 'Student';
      let targetGoal = 'Exam Mastery';
      let subjectsSummary: Array<{ name: string; confidence: string; examDate?: string }> = [];
      let todayTasksSummary: Array<{ title: string; subject: string; completed: boolean; duration: number }> = [];
      let overallProgressPercentage = 0;
      let streakDays = 1;

      if (userId) {
        const queryFilter: any = { userId };
        if (planId) queryFilter._id = planId;
        const activePlan = await StudyPlan.findOne(queryFilter).sort({ createdAt: -1 });

        if (activePlan) {
          planTitle = activePlan.title;
          gradeLevel = activePlan.educationLevel || 'Undergraduate';
          targetGoal = activePlan.examType || 'Final Exams';
          subjectsSummary = (activePlan.subjects || []).map((s) => ({
            name: s.name,
            confidence: s.confidence,
            examDate: s.examDate
          }));

          const todayStr = formatDate(new Date());
          const todayTasks = await StudyTask.find({ userId, planId: activePlan._id, date: todayStr });
          todayTasksSummary = todayTasks.map((t) => ({
            title: t.title,
            subject: t.subjectName,
            completed: t.status === 'COMPLETED',
            duration: t.duration
          }));

          const allTasks = await StudyTask.find({ userId, planId: activePlan._id });
          if (allTasks.length > 0) {
            const completedCount = allTasks.filter((t) => t.status === 'COMPLETED').length;
            overallProgressPercentage = Math.round((completedCount / allTasks.length) * 100);
          }
        }
      }

      const answer = await aiService.askStudyAssistantWithAI(query.trim(), {
        studentName: req.user?.email ? req.user.email.split('@')[0] : 'Scholar',
        gradeLevel,
        targetGoal,
        planTitle,
        subjectsSummary,
        todayTasksSummary,
        overallProgressPercentage,
        streakDays
      });

      res.status(200).json({
        success: true,
        data: {
          query,
          answer,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err: any) {
      console.error('[AIController] askAssistant error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'AI_ERROR', message: err.message || 'Failed to generate assistant response' }
      });
    }
  }

  /**
   * POST /api/ai/breakdown-task
   * Breaks down a single task into Pomodoro phases
   */
  async breakdownTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { subject, topic, duration } = req.body;
      if (!topic) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Topic is required' }
        });
        return;
      }

      const breakdown = await aiService.breakdownTaskWithAI(
        subject || 'General Study',
        topic,
        duration ? Number(duration) : 60
      );

      res.status(200).json({
        success: true,
        data: breakdown
      });
    } catch (err: any) {
      console.error('[AIController] breakdownTask error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'AI_ERROR', message: err.message || 'Failed to break down task' }
      });
    }
  }

  /**
   * POST /api/ai/reschedule-advice
   * Provides intelligent reasoning for rescheduling a task
   */
  async getRescheduleAdvice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { taskId } = req.body;
      const userId = req.user?.userId;

      if (!taskId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'taskId is required' }
        });
        return;
      }

      const task = await StudyTask.findOne({ _id: taskId, userId });
      if (!task) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Task not found' }
        });
        return;
      }

      // Calculate free slots in upcoming 3 days
      const freeSlotsInComingDays: any[] = [];
      const today = new Date();
      for (let i = 1; i <= 3; i++) {
        const nextDateStr = addDays(formatDate(today), i);
        const dayTasks = await StudyTask.find({ userId, date: nextDateStr });
        const currentLoad = dayTasks.reduce((acc, t) => acc + (t.duration || 60), 0);
        const dayName = getDayOfWeekName(nextDateStr);
        freeSlotsInComingDays.push({
          date: nextDateStr,
          dayName,
          currentLoadMinutes: currentLoad,
          availableMinutes: Math.max(0, 300 - currentLoad)
        });
      }

      const advice = await aiService.recommendAdaptiveRescheduleWithAI({
        taskTitle: task.title,
        subject: task.subjectName,
        topic: task.topic,
        originalDate: task.date,
        missedDurationMinutes: task.duration || 60,
        freeSlotsInComingDays
      });

      res.status(200).json({
        success: true,
        data: advice
      });
    } catch (err: any) {
      console.error('[AIController] getRescheduleAdvice error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'AI_ERROR', message: err.message || 'Failed to get reschedule advice' }
      });
    }
  }
}

export const aiController = new AIController();
