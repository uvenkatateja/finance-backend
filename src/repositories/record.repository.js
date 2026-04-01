const { prisma } = require('../prisma/client');

/**
 * RecordRepository — abstracts all database access for FinancialRecord.
 * All queries filter out soft-deleted records (deletedAt IS NULL) by default.
 */
class RecordRepository {
  /**
   * Create a new financial record.
   */
  async create(data) {
    return prisma.financialRecord.create({ data });
  }

  /**
   * Find a single record by ID (excluding soft-deleted).
   */
  async findById(id) {
    return prisma.financialRecord.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Find all records with filtering, sorting, and pagination.
   * Supports: type, category, dateFrom, dateTo.
   */
  async findAll({ limit, offset, filters = {} }) {
    const where = { deletedAt: null };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.financialRecord.count({ where }),
    ]);

    return { records, total };
  }

  /**
   * Update a record by ID.
   */
  async update(id, data) {
    return prisma.financialRecord.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete — set deletedAt timestamp instead of removing the row.
   */
  async softDelete(id) {
    return prisma.financialRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Hard delete (for admin cleanup).
   */
  async hardDelete(id) {
    return prisma.financialRecord.delete({ where: { id } });
  }

  // ─── Aggregation Queries for Dashboard ──────────────────────────────────────

  /**
   * Sum of all income (non-deleted records).
   */
  async getTotalIncome() {
    const result = await prisma.financialRecord.aggregate({
      where: { type: 'income', deletedAt: null },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }

  /**
   * Sum of all expenses (non-deleted records).
   */
  async getTotalExpenses() {
    const result = await prisma.financialRecord.aggregate({
      where: { type: 'expense', deletedAt: null },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }

  /**
   * Category-wise totals grouped by type.
   */
  async getCategoryTotals() {
    const results = await prisma.financialRecord.groupBy({
      by: ['category', 'type'],
      where: { deletedAt: null },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
    });
    return results;
  }

  /**
   * Monthly trends: income and expense totals per month.
   * Uses raw SQL for date_trunc grouping.
   */
  async getMonthlyTrends(months = 12) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const result = await prisma.$queryRaw`
      SELECT
        date_trunc('month', date) AS month,
        type,
        SUM(amount) AS total,
        COUNT(*)::int AS count
      FROM financial_records
      WHERE deleted_at IS NULL
        AND date >= ${cutoffDate}
      GROUP BY date_trunc('month', date), type
      ORDER BY month DESC
    `;
    return result;
  }

  /**
   * Recent activity — last N records.
   */
  async getRecentActivity(limit = 10) {
    return prisma.financialRecord.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
  }
}

module.exports = { RecordRepository };
