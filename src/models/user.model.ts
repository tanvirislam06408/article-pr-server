import { query } from "../config/db";
import { User, Role } from "../types";

export interface CreateUserData {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role?: Role;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateUserData {
  name?: string;
  passwordHash?: string;
  bio?: string;
  avatarUrl?: string;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const res = await query<any>(
      `SELECT id, name, email, password_hash AS "passwordHash", role, bio, avatar_url AS "avatarUrl", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    return res.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const res = await query<any>(
      `SELECT id, name, email, password_hash AS "passwordHash", role, bio, avatar_url AS "avatarUrl", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM users WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async create(data: CreateUserData): Promise<User> {
    const res = await query<any>(
      `INSERT INTO users (id, name, email, password_hash, role, bio, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, bio, avatar_url AS "avatarUrl", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.id,
        data.name,
        data.email.toLowerCase(),
        data.passwordHash,
        data.role || "author",
        data.bio || null,
        data.avatarUrl || null,
      ]
    );
    return res.rows[0];
  }

  static async update(id: string, data: UpdateUserData): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.passwordHash !== undefined) {
      fields.push(`password_hash = $${idx++}`);
      values.push(data.passwordHash);
    }
    if (data.bio !== undefined) {
      fields.push(`bio = $${idx++}`);
      values.push(data.bio);
    }
    if (data.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${idx++}`);
      values.push(data.avatarUrl);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await query<any>(
      `UPDATE users
       SET ${fields.join(", ")}
       WHERE id = $${idx}
       RETURNING id, name, email, role, bio, avatar_url AS "avatarUrl", created_at AS "createdAt", updated_at AS "updatedAt"`,
      values
    );
    return res.rows[0] || null;
  }
}
