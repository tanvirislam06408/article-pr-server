import { query } from "../config/db";
import { ContactMessage, Subscriber } from "../types";

export interface CreateContactData {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export class ContactModel {
  static async createMessage(data: CreateContactData): Promise<ContactMessage> {
    const res = await query<any>(
      `INSERT INTO contacts (id, name, email, subject, message, status)
       VALUES ($1, $2, $3, $4, $5, 'unread')
       RETURNING id, name, email, subject, message, status, created_at AS "createdAt"`,
      [data.id, data.name, data.email, data.subject || null, data.message]
    );
    return res.rows[0];
  }

  static async getAllMessages(): Promise<ContactMessage[]> {
    const res = await query<any>(
      `SELECT id, name, email, subject, message, status, created_at AS "createdAt"
       FROM contacts
       ORDER BY created_at DESC`
    );
    return res.rows;
  }

  static async updateMessageStatus(
    id: string,
    status: "unread" | "read" | "replied"
  ): Promise<ContactMessage | null> {
    const res = await query<any>(
      `UPDATE contacts
       SET status = $1
       WHERE id = $2
       RETURNING id, name, email, subject, message, status, created_at AS "createdAt"`,
      [status, id]
    );
    return res.rows[0] || null;
  }

  static async addSubscriber(id: string, email: string): Promise<Subscriber> {
    const res = await query<any>(
      `INSERT INTO subscribers (id, email, is_active)
       VALUES ($1, $2, true)
       ON CONFLICT (email) DO UPDATE SET is_active = true
       RETURNING id, email, is_active AS "isActive", subscribed_at AS "subscribedAt"`,
      [id, email.toLowerCase()]
    );
    return res.rows[0];
  }

  static async getAllSubscribers(): Promise<Subscriber[]> {
    const res = await query<any>(
      `SELECT id, email, is_active AS "isActive", subscribed_at AS "subscribedAt"
       FROM subscribers
       ORDER BY subscribed_at DESC`
    );
    return res.rows;
  }
}
