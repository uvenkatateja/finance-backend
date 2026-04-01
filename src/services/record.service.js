const { ApiError } = require('../utils/ApiError');
const { logger } = require('../utils/logger');

/**
 * RecordService — all business logic for financial records.
 * Delegates data access to RecordRepository.
 */
class RecordService {
  constructor(recordRepository) {
    this.recordRepo = recordRepository;
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  /**
   * Create a new financial record.
   */
  async createRecord(data, userId) {
    const record = await this.recordRepo.create({
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: new Date(data.date),
      notes: data.notes || null,
      createdBy: userId,
    });

    logger.info('Financial record created', {
      recordId: record.id,
      type: record.type,
      amount: record.amount,
      userId,
    });

    return record;
  }

  /**
   * Get a single record by ID.
   */
  async getRecordById(id) {
    const record = await this.recordRepo.findById(id);
    if (!record) {
      throw ApiError.notFound('Financial record not found');
    }
    return record;
  }

  /**
   * Get all records with pagination and optional filters.
   */
  async getAllRecords(pagination, filters) {
    const { records, total } = await this.recordRepo.findAll({
      limit: pagination.limit,
      offset: pagination.offset,
      filters,
    });

    return {
      records,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  /**
   * Update a financial record.
   */
  async updateRecord(id, data) {
    const existing = await this.recordRepo.findById(id);
    if (!existing) {
      throw ApiError.notFound('Financial record not found');
    }

    const updateData = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await this.recordRepo.update(id, updateData);

    logger.info('Financial record updated', { recordId: id });

    return updated;
  }

  /**
   * Soft delete a financial record.
   */
  async deleteRecord(id) {
    const existing = await this.recordRepo.findById(id);
    if (!existing) {
      throw ApiError.notFound('Financial record not found');
    }

    await this.recordRepo.softDelete(id);

    logger.info('Financial record soft-deleted', { recordId: id });

    return { id, deleted: true };
  }
}

module.exports = { RecordService };
