const { Router } = require('express');
const { dashboardController } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

const router = Router();

// All dashboard routes require authentication + read_analytics permission
router.use(authenticate);
router.use(authorize('read_analytics'));

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard summary and analytics (analyst + admin)
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get full dashboard summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIncome:
 *                       type: number
 *                     totalExpenses:
 *                       type: number
 *                     netBalance:
 *                       type: number
 *                     categoryTotals:
 *                       type: array
 *                     recentActivity:
 *                       type: array
 */
router.get(
  '/summary',
  dashboardController.getSummary.bind(dashboardController)
);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get monthly income/expense trends
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of months to look back
 *     responses:
 *       200:
 *         description: Monthly trends data
 */
router.get(
  '/trends',
  dashboardController.getMonthlyTrends.bind(dashboardController)
);

/**
 * @swagger
 * /api/dashboard/categories:
 *   get:
 *     summary: Get category-wise income/expense breakdown
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown data
 */
router.get(
  '/categories',
  dashboardController.getCategoryBreakdown.bind(dashboardController)
);

module.exports = router;
