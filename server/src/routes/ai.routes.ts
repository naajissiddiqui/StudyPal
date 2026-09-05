import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Optional authentication for AI topics, breakdown, and assistant (works for guest or logged-in users)
router.post('/suggest-topics', (req, res) => aiController.suggestTopics(req, res));
router.post('/breakdown-task', (req, res) => aiController.breakdownTask(req, res));
router.post('/ask-assistant', (req, res, next) => {
  // Try to authenticate if header present, but don't reject guests
  if (req.headers.authorization) {
    return authenticate(req, res, () => aiController.askAssistant(req, res));
  }
  return aiController.askAssistant(req, res);
});
router.post('/reschedule-advice', authenticate, (req, res) => aiController.getRescheduleAdvice(req, res));

export default router;
