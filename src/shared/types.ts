import type { Request } from "express";
import type { ValidationError } from "express-validator";
import type { JwtPayload } from "jsonwebtoken";
import type { Socket } from "socket.io";

export type CustomError = Error & {
  statusCode?: number;
  data?: ValidationError[];
};

export interface UserPayload extends JwtPayload {
  email: string;
  userId: string;
}

export interface AuthRequest extends Request {
  userId?: string;
}

export interface AuthSocket extends Socket {
  userId?: string;
}

export interface SendMessageEvent {
  roomId: string;
  content: string;
}

export interface ClientTyping {
  roomId: string;
}


export interface ReadReceipt {
  messageId: string
}