import express from 'express';
import { getActivities } from '../controllers/activityController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin-only authorization
router.use(protect);
router.use(requireRole('ADMIN'));

router.get('/', getActivities);

export default router;
