import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/today', (req, res, next) => taskController.getTodayTasks(req, res, next));
router.get('/weekly', (req, res, next) => taskController.getWeeklyTasks(req, res, next));
router.patch('/:taskId/complete', (req, res, next) => taskController.completeTask(req, res, next));
router.patch('/:taskId/reschedule', (req, res, next) => taskController.rescheduleTask(req, res, next));

export default router;
