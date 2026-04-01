const { UserService } = require('../services/user.service');
const { UserRepository } = require('../repositories/user.repository');
const { successResponse, parsePagination } = require('../utils/helpers');

// Dependency injection: controller → service → repository
const userService = new UserService(new UserRepository());

/**
 * AuthController — handles registration and login.
 */
class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const user = await userService.register(req.body);
      res.status(201).json(successResponse(user, 'User registered successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const result = await userService.login(req.body);
      res.status(200).json(successResponse(result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me — get current authenticated user
   */
  async getProfile(req, res, next) {
    try {
      const user = await userService.getUserById(req.user.id);
      res.status(200).json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/auth/profile — update own profile
   */
  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.id, req.body);
      res.status(200).json(successResponse(user, 'Profile updated'));
    } catch (error) {
      next(error);
    }
  }
}

/**
 * UserController — handles admin user management.
 */
class UserController {
  /**
   * GET /api/users
   */
  async getAllUsers(req, res, next) {
    try {
      const pagination = parsePagination(req.query);
      const { users, total } = await userService.getAllUsers(pagination);

      res.status(200).json(
        successResponse(users, 'Users retrieved', {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:id/role
   */
  async updateRole(req, res, next) {
    try {
      const user = await userService.updateUserRole(req.params.id, req.body.role);
      res.status(200).json(successResponse(user, 'Role updated'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const user = await userService.updateUserStatus(
        req.params.id,
        req.body.status
      );
      res.status(200).json(successResponse(user, 'Status updated'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = {
  authController: new AuthController(),
  userController: new UserController(),
};
