import { Request, Response, NextFunction } from "express";
import { ContactModel } from "../models/contact.model";
import { sendResponse } from "../utils/apiResponse";

export class ContactController {
  static async submitMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, subject, message } = req.body;
      const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const created = await ContactModel.createMessage({
        id,
        name,
        email,
        subject,
        message,
      });

      return sendResponse(res, {
        statusCode: 201,
        message: "Message submitted successfully. Thank you for reaching out!",
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }

  static async subscribeNewsletter(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const subscriber = await ContactModel.addSubscriber(id, email);

      return sendResponse(res, {
        statusCode: 200,
        message: "Successfully subscribed to Monon newsletter!",
        data: subscriber,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMessages(_req: Request, res: Response, next: NextFunction) {
    try {
      const messages = await ContactModel.getAllMessages();
      return sendResponse(res, {
        statusCode: 200,
        message: "Contact messages retrieved successfully",
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSubscribers(_req: Request, res: Response, next: NextFunction) {
    try {
      const subscribers = await ContactModel.getAllSubscribers();
      return sendResponse(res, {
        statusCode: 200,
        message: "Subscribers retrieved successfully",
        data: subscribers,
      });
    } catch (error) {
      next(error);
    }
  }
}
