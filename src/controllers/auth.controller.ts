import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/user.model";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { ApiError } from "../utils/apiError";
import { sendResponse } from "../utils/apiResponse";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role, bio, avatarUrl } = req.body;

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return next(ApiError.conflict("User with this email already exists"));
      }

      const passwordHash = await hashPassword(password);
      const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const user = await UserModel.create({
        id: userId,
        name,
        email,
        passwordHash,
        role: role || "author",
        bio,
        avatarUrl,
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return sendResponse(res, {
        statusCode: 201,
        message: "User registered successfully",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user || !user.passwordHash) {
        return next(ApiError.unauthorized("Invalid email or password"));
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        return next(ApiError.unauthorized("Invalid email or password"));
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return sendResponse(res, {
        statusCode: 200,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized());
      }

      const user = await UserModel.findById(req.user.userId);
      if (!user) {
        return next(ApiError.notFound("User not found"));
      }

      const { passwordHash: _, ...safeUser } = user;

      return sendResponse(res, {
        statusCode: 200,
        message: "Current user fetched successfully",
        data: safeUser,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized());
      }

      const { name, bio, avatarUrl, password } = req.body;
      const updateData: any = { name, bio, avatarUrl };

      if (password) {
        updateData.passwordHash = await hashPassword(password);
      }

      const updated = await UserModel.update(req.user.userId, updateData);
      if (!updated) {
        return next(ApiError.notFound("User not found"));
      }

      const { passwordHash: _, ...safeUser } = updated;

      return sendResponse(res, {
        statusCode: 200,
        message: "Profile updated successfully",
        data: safeUser,
      });
    } catch (error) {
      next(error);
    }
  }
}
