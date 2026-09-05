import { Router } from 'express';
import { planController } from '../controllers/plan.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', (req, res, next) => planController.createPlan(req, res, next));
router.get('/active', (req, res, next) => planController.getActivePlan(req, res, next));
router.get('/:planId', (req, res, next) => planController.getPlanById(req, res, next));
router.get('/', (req, res, next) => planController.getAllPlans(req, res, next));

export default router;
