import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { StudyTask } from '../models/StudyTask';
import { plannerService } from '../services/planner.service';
import { formatDate, addDays, parseDate } from '../utils/dateUtils';

const CompleteTaskSchema = z.object({
  actualDuration: z.number().min(1).optional()
});

const RescheduleTaskSchema = z.object({
  mode: z.enum(['TOMORROW', 'NEXT_SLOT', 'CUSTOM_DATE']).default('TOMORROW'),
  targetDate: z.string().optional(),
  targetStartTime: z.string().optional()
});

export class TaskController {
  /**
   * Get Today's tasks with completion metrics
   */
  async getTodayTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const todayStr = (req.query.date as string) || formatDate(new Date());

      const tasks = await StudyTask.find({
        userId: req.user.userId,
        date: todayStr
      }).sort({ startTime: 1 });

      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'COMPLETED').length;
      const pending = tasks.filter(t => t.status === 'PENDING' || t.status === 'RESCHEDULED').length;
      const missed = tasks.filter(t => t.status === 'MISSED').length;

      res.status(200).json({
        success: true,
        date: todayStr,
        metrics: {
          total,
          completed,
          pending,
          missed,
          progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0
        },
        tasks
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Weekly tasks (Monday through Sunday)
   */
  async getWeeklyTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Calculate Monday of current week or specified startDate
      let startStr = req.query.startDate as string;
      if (!startStr) {
        const today = new Date();
        const dayOfWeek = today.getDay(); // Sunday=0, Monday=1
        const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + distanceToMonday);
        startStr = formatDate(monday);
      }

      const endStr = addDays(startStr, 6); // 7 days (Mon-Sun)

      const tasks = await StudyTask.find({
        userId: req.user.userId,
        date: { $gte: startStr, $lte: endStr }
      }).sort({ date: 1, startTime: 1 });

      res.status(200).json({
        success: true,
        startDate: startStr,
        endDate: endStr,
        count: tasks.length,
        tasks
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete a task
   */
  async completeTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const taskId = String(req.params.taskId);
      const validated = CompleteTaskSchema.parse(req.body);

      const task = await StudyTask.findOne({
        _id: taskId,
        userId: req.user.userId
      });

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      task.status = 'COMPLETED';
      task.completedAt = new Date();
      if (validated.actualDuration) {
        task.actualDuration = validated.actualDuration;
      }

      await task.save();

      res.status(200).json({
        success: true,
        message: 'Task marked as completed 🎉',
        task
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reschedule a task
   */
  async rescheduleTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const taskId = String(req.params.taskId);
      const validated = RescheduleTaskSchema.parse(req.body);

      const updatedTask = await plannerService.rescheduleTask(
        taskId,
        req.user.userId,
        validated
      );

      res.status(200).json({
        success: true,
        message: `Task rescheduled to ${updatedTask.date} at ${updatedTask.startTime}`,
        task: updatedTask
      });
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
