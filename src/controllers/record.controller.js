const { RecordService } = require('../services/record.service');
const { RecordRepository } = require('../repositories/record.repository');
const { successResponse, parsePagination } = require('../utils/helpers');

const recordService = new RecordService(new RecordRepository());

/**
 * RecordController — handles financial record CRUD operations.
 */
class RecordController {
  /**
   * POST /api/records
   */
  async create(req, res, next) {
    try {
      const record = await recordService.createRecord(req.body, req.user.id);
      res.status(201).json(successResponse(record, 'Record created'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/records
   * Supports query filters: type, category, dateFrom, dateTo, page, limit
   */
  async getAll(req, res, next) {
    try {
      const pagination = parsePagination(req.query);
      const filters = {
        type: req.query.type,
        category: req.query.category,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };

      const result = await recordService.getAllRecords(pagination, filters);

      res.status(200).json(
        successResponse(result.records, 'Records retrieved', result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/records/:id
   */
  async getById(req, res, next) {
    try {
      const record = await recordService.getRecordById(req.params.id);
      res.status(200).json(successResponse(record));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/records/:id
   */
  async update(req, res, next) {
    try {
      const record = await recordService.updateRecord(req.params.id, req.body);
      res.status(200).json(successResponse(record, 'Record updated'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/records/:id (soft delete)
   */
  async delete(req, res, next) {
    try {
      const result = await recordService.deleteRecord(req.params.id);
      res.status(200).json(successResponse(result, 'Record deleted'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { recordController: new RecordController() };
