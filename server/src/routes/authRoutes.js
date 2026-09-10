import express from 'express';
import { login, getMe, changePassword, getPublicStats } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/stats', getPublicStats);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

export default router;

