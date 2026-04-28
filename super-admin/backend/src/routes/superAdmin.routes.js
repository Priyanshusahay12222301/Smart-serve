import express from 'express';
import {
  createSmartServe,
  createSmartAdmin,
  getAllSmartServe,
  getSmartServeById,
  updateSmartServe,
  deleteSmartServe,
  updateSubscription,
  getSystemStats,
  getAnalytics,
  getPlatformSettings,
  updatePlatformSettings,
  resetRestaurantPassword,
  impersonateRestaurant,
  createSupportTicket,
  getSupportTickets,
  updateSupportTicket,
  fixMissingRestaurantIds,
  fixDemoRestaurant,
} from '../controllers/superAdmin.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all routes and restrict to SUPER_ADMIN only
router.use(protect);
router.use(restrictTo('SUPER_ADMIN'));

// SmartServe routes
router.post('/smartserve/create', createSmartServe);
router.get('/smartserve/all', getAllSmartServe);
router.get('/smartserve/:id', getSmartServeById);
router.put('/smartserve/:id', updateSmartServe);
router.put('/smartserve/:id/subscription', updateSubscription);
router.delete('/smartserve/:id', deleteSmartServe);
router.post('/smartserve/fix-missing-ids', fixMissingRestaurantIds);
router.post('/smartserve/fix-demo-restaurant', fixDemoRestaurant);

// User management
router.post('/user/create-admin', createSmartAdmin);

// System stats
router.get('/stats', getSystemStats);
router.get('/analytics', getAnalytics);

// Platform settings
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);

// Support tools
router.post('/support/reset-password', resetRestaurantPassword);
router.post('/support/impersonate/:id', impersonateRestaurant);
router.post('/support/tickets', createSupportTicket);
router.get('/support/tickets', getSupportTickets);
router.put('/support/tickets/:id', updateSupportTicket);

export default router;
