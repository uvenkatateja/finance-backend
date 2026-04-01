const { z } = require('zod');

// ─── Record Validators ───────────────────────────────────────────────────────

const createRecordSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount exceeds maximum'),
  type: z.enum(['income', 'expense'], {
    required_error: 'Type is required',
    invalid_type_error: 'Type must be income or expense',
  }),
  category: z
    .string({ required_error: 'Category is required' })
    .min(1, 'Category is required')
    .max(100),
  date: z
    .string({ required_error: 'Date is required' })
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

const updateRecordSchema = z
  .object({
    amount: z.number().positive('Amount must be positive').max(999999999.99).optional(),
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().min(1).max(100).optional(),
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format')
      .optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  );

// ─── Filter / Query Validators ───────────────────────────────────────────────

const recordFilterSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().max(100).optional(),
  dateFrom: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid dateFrom format')
    .optional(),
  dateTo: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid dateTo format')
    .optional(),
  page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
});

module.exports = {
  createRecordSchema,
  updateRecordSchema,
  recordFilterSchema,
};
