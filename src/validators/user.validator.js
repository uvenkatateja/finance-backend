const { z } = require('zod');

// ─── Auth Validators ──────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .max(255),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100),
  role: z.enum(['admin', 'analyst', 'viewer']).optional(),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ─── User Management Validators ──────────────────────────────────────────────

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'analyst', 'viewer'], {
    required_error: 'Role is required',
    invalid_type_error: 'Role must be admin, analyst, or viewer',
  }),
});

const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be active or inactive',
  }),
});

const updateProfileSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email('Invalid email format').max(255).optional(),
  })
  .refine((data) => data.name || data.email, {
    message: 'At least one field (name or email) must be provided',
  });

module.exports = {
  registerSchema,
  loginSchema,
  updateRoleSchema,
  updateStatusSchema,
  updateProfileSchema,
};
