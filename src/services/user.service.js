const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/ApiError');
const { logger } = require('../utils/logger');

const SALT_ROUNDS = 12;

/**
 * UserService — all business logic for user management.
 * Delegates data access to UserRepository.
 */
class UserService {
  constructor(userRepository) {
    this.userRepo = userRepository;
  }

  // ─── Authentication ───────────────────────────────────────────────────────

  /**
   * Register a new user. Hashes password, enforces unique email.
   */
  async register({ email, password, name, role }) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await this.userRepo.create({
      email,
      password: hashedPassword,
      name,
      role: role || 'viewer',
    });

    logger.info('User registered', { userId: user.id, email: user.email });

    return this._sanitizeUser(user);
  }

  /**
   * Authenticate user with email + password. Returns JWT token + user data.
   */
  async login({ email, password }) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status === 'inactive') {
      throw ApiError.forbidden('Account is deactivated. Contact an administrator.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = this._generateToken(user);

    logger.info('User logged in', { userId: user.id });

    return { user: this._sanitizeUser(user), token };
  }

  // ─── User Management (Admin) ─────────────────────────────────────────────

  /**
   * Get all users with pagination.
   */
  async getAllUsers(pagination) {
    return this.userRepo.findAll(pagination);
  }

  /**
   * Get a single user by ID.
   */
  async getUserById(id) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return this._sanitizeUser(user);
  }

  /**
   * Update user role (admin only).
   */
  async updateUserRole(userId, newRole) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const updated = await this.userRepo.update(userId, { role: newRole });

    logger.info('User role updated', { userId, newRole });

    return this._sanitizeUser(updated);
  }

  /**
   * Activate or deactivate a user (admin only).
   */
  async updateUserStatus(userId, status) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const updated = await this.userRepo.update(userId, { status });

    logger.info('User status updated', { userId, status });

    return this._sanitizeUser(updated);
  }

  /**
   * Update user's own profile (name, email).
   */
  async updateProfile(userId, { name, email }) {
    if (email) {
      const existing = await this.userRepo.findByEmail(email);
      if (existing && existing.id !== userId) {
        throw ApiError.conflict('Email already in use');
      }
    }

    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;

    const updated = await this.userRepo.update(userId, data);
    return this._sanitizeUser(updated);
  }

  // ─── Internal Helpers ─────────────────────────────────────────────────────

  _generateToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  _sanitizeUser(user) {
    const { password, ...safe } = user;
    return safe;
  }
}

module.exports = { UserService };
