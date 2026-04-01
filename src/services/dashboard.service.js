const { logger } = require('../utils/logger');

/**
 * DashboardService — aggregation and analytics logic.
 * Delegates data access to RecordRepository.
 */
class DashboardService {
  constructor(recordRepository) {
    this.recordRepo = recordRepository;
  }

  /**
   * Get the full dashboard summary in a single call.
   */
  async getSummary() {
    const [totalIncome, totalExpenses, categoryTotals, recentActivity] =
      await Promise.all([
        this.recordRepo.getTotalIncome(),
        this.recordRepo.getTotalExpenses(),
        this.recordRepo.getCategoryTotals(),
        this.recordRepo.getRecentActivity(10),
      ]);

    const netBalance = totalIncome - totalExpenses;

    logger.info('Dashboard summary generated');

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      categoryTotals: this._formatCategoryTotals(categoryTotals),
      recentActivity,
    };
  }

  /**
   * Get monthly income/expense trends.
   */
  async getMonthlyTrends(months = 12) {
    const raw = await this.recordRepo.getMonthlyTrends(months);
    return this._formatMonthlyTrends(raw);
  }

  /**
   * Get category-wise breakdown.
   */
  async getCategoryBreakdown() {
    const raw = await this.recordRepo.getCategoryTotals();
    return this._formatCategoryTotals(raw);
  }

  // ─── Formatting Helpers ─────────────────────────────────────────────────

  _formatCategoryTotals(raw) {
    const map = {};
    for (const row of raw) {
      if (!map[row.category]) {
        map[row.category] = { income: 0, expense: 0, count: 0 };
      }
      map[row.category][row.type] = row._sum.amount || 0;
      map[row.category].count += row._count.id || 0;
    }
    return Object.entries(map).map(([category, data]) => ({
      category,
      ...data,
      net: data.income - data.expense,
    }));
  }

  _formatMonthlyTrends(raw) {
    const map = {};
    for (const row of raw) {
      const monthKey = new Date(row.month).toISOString().slice(0, 7); // YYYY-MM
      if (!map[monthKey]) {
        map[monthKey] = { month: monthKey, income: 0, expense: 0 };
      }
      map[monthKey][row.type] = parseFloat(row.total) || 0;
    }
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }
}

module.exports = { DashboardService };
