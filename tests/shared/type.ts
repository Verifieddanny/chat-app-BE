import type { Response } from "express";
import * as sinon from "sinon";

export interface TestResponse extends Response {
  statusCode: number;
  auth_token: string;
  loadedUser: string;
  message?: string;
  groupName?: string;
  creator?: string;
  messagesLength?: number;
  data?: {};
  json: sinon.SinonSpy;
}
