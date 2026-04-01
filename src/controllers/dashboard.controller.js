const { DashboardService } = require('../services/dashboard.service');
const { RecordRepository } = require('../repositories/record.repository');
const { successResponse } = require('../utils/helpers');

const dashboardService = new DashboardService(new RecordRepository());

/**
 * DashboardController — handles aggregated dashboard data endpoints.
 */
class DashboardController {
  /**
   * GET /api/dashboard/summary
   * Returns: totalIncome, totalExpenses, netBalance, categoryTotals, recentActivity
   */
  async getSummary(req, res, next) {
    try {
      const summary = await dashboardService.getSummary();
      res.status(200).json(successResponse(summary, 'Dashboard summary'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/trends?months=12
   * Returns: monthly income/expense trends
   */
  async getMonthlyTrends(req, res, next) {
    try {
      const months = parseInt(req.query.months) || 12;
      const trends = await dashboardService.getMonthlyTrends(months);
      res.status(200).json(successResponse(trends, 'Monthly trends'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/categories
   * Returns: category-wise income/expense breakdown
   */
  async getCategoryBreakdown(req, res, next) {
    try {
      const breakdown = await dashboardService.getCategoryBreakdown();
      res.status(200).json(successResponse(breakdown, 'Category breakdown'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { dashboardController: new DashboardController() };
