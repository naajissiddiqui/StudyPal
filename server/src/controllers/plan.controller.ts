import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { plannerService } from '../services/planner.service';
import { StudyPlan } from '../models/StudyPlan';

const CreatePlanSchema = z.object({
  title: z.string().optional(),
  educationLevel: z.string().optional(),
  examType: z.string().optional(),
  examStartDate: z.string().min(10, 'Valid start date required (YYYY-MM-DD)'),
  examEndDate: z.string().min(10, 'Valid end date required (YYYY-MM-DD)'),
  dailyHoursWeekday: z.number().min(0.5).max(16).default(3),
  dailyHoursWeekend: z.number().min(0.5).max(16).default(5),
  preferredStudyStart: z.string().default('09:00'),
  preferredStudyEnd: z.string().default('21:00'),
  sessionLength: z.number().min(15).max(180).default(60),
  breakDuration: z.number().min(0).max(60).default(15),
  subjects: z.array(
    z.object({
      name: z.string().min(1, 'Subject name required'),
      examDate: z.string().min(10, 'Exam date required'),
      difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
      confidence: z.enum(['WEAK', 'AVERAGE', 'STRONG']).default('AVERAGE'),
      topics: z.array(
        z.object({
          name: z.string().min(1, 'Topic name required'),
          status: z.enum(['WEAK', 'AVERAGE', 'STRONG', 'COMPLETED']).optional()
        })
      ).min(1, 'At least 1 topic per subject is required')
    })
  ).min(1, 'At least 1 subject is required')
});

export class PlanController {
  async createPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validated = CreatePlanSchema.parse(req.body);

      // Archive any previous active plans
      await StudyPlan.updateMany(
        { userId: req.user.userId, status: 'ACTIVE' },
        { $set: { status: 'ARCHIVED' } }
      );

      const result = await plannerService.generateStudyPlan({
        ...validated,
        title: validated.title || `${validated.examType || 'Semester'} Study Plan`,
        userId: req.user.userId
      });

      res.status(201).json({
        success: true,
        message: 'Study plan generated successfully',
        plan: result.plan,
        taskCount: result.taskCount
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const plan = await StudyPlan.findOne({
        userId: req.user.userId,
        status: 'ACTIVE'
      }).sort({ createdAt: -1 });

      if (!plan) {
        res.status(200).json({
          success: true,
          plan: null,
          message: 'No active study plan found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        plan
      });
    } catch (error) {
      next(error);
    }
  }

  async getPlanById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const plan = await StudyPlan.findOne({
        _id: req.params.planId,
        userId: req.user.userId
      });

      if (!plan) {
        res.status(404).json({ error: 'Plan not found' });
        return;
      }

      res.status(200).json({
        success: true,
        plan
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllPlans(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const plans = await StudyPlan.find({ userId: req.user.userId }).sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        plans
      });
    } catch (error) {
      next(error);
    }
  }
}

export const planController = new PlanController();
