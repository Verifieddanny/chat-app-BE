import type { ExtendedError } from "socket.io";
import jwt from "jsonwebtoken";
import type { AuthSocket, CustomError, UserPayload } from "../shared/types.js";

export const SocketAuth = (
  socket: AuthSocket,
  next: (err?: ExtendedError) => void,
) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    const error: CustomError = new Error("Not Authenticated");
    error.statusCode = 401;
    return next(error);
  }

  let decodedToken: UserPayload = jwt.verify(
    token,
    process.env.SECRETE_KEY!,
  ) as UserPayload;

  if (!decodedToken) {
    const error: CustomError = new Error("Not Authenticated");
    error.statusCode = 401;
    return next(error);
  }

  socket.userId = decodedToken.userId;
  next();
};
