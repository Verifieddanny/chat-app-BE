import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import dotenv from "dotenv";
import type {
  AuthSocket,
  ClientTyping,
  CustomError,
  ReadReceipt,
  SendMessageEvent,
} from "./shared/types.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { connect } from "mongoose";
import AuthRouter from "./routes/auth.js";
import RoomRouter from "./routes/room.js";
import MessageRouter from "./routes/message.js";
import { SocketAuth } from "./middleware/socket-auth.js";
import {
  addUserToViewedBy,
  getAllUserRooms,
  saveMessage,
  updateLastSeen,
} from "./shared/helper.js";

dotenv.config();

const app: Application = express();

app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(
  (error: CustomError, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = error.statusCode || 500;
    const message = error.message;
    const data = error.data;

    res.status(statusCode).json({ message, data });
  },
);

app.use("/auth", AuthRouter);
app.use("/rooms", RoomRouter);
app.use("/messages", MessageRouter);

export const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.use(SocketAuth);

const isDBConnected = await connect(process.env.MONGODB_URL!);
if (isDBConnected) {
  console.log("Connected to MongoDB");
}

io.on("connection", async (socket) => {
  const authSocket = socket as AuthSocket;
  console.log("User connected:", authSocket.userId);

  const userRooms = await getAllUserRooms(authSocket.userId || "");

  userRooms.forEach((r) => {
    socket.join(r._id.toString());
    socket.to(r._id.toString()).emit("server:user_online", {
      user: authSocket.userId,
      status: "online",
    });
  });

  console.log(`Joined ${userRooms.length} rooms`);

  socket.join(authSocket.userId?.toString() || "");

  socket.on("client:send_message", async (args: SendMessageEvent) => {
    const savedMessage = await saveMessage(
      args.roomId,
      args.content,
      authSocket.userId || "",
    );

    socket.to(savedMessage.to.toString()).emit("server:new_message", {
      roomId: savedMessage.to.toString(),
      content: savedMessage.content,
      from: authSocket.userId,
      timeStamp: new Date().toISOString(),
    });
  });

  socket.on("client:is_typing", (args: ClientTyping) => {
    socket.to(args.roomId.toString()).emit("server:user_typing", {
      roomId: args.roomId,
      userId: authSocket.userId,
    });
  });

  socket.on("client:read_receipt", async (args: ReadReceipt) => {
    const updatedMessage = await addUserToViewedBy(
      args.messageId,
      authSocket.userId || "",
    );

    if (updatedMessage) {
      socket.to(updatedMessage.from.toString()).emit("server:viewed_message", {
        messageId: args.messageId,
        roomId: updatedMessage.to.toString(),
        viewedBy: updatedMessage.viewedBy,
      });
    }
  });

  socket.on("disconnect", async () => {
    const updatedUser = await updateLastSeen(authSocket.userId || "");
    if (updatedUser) {
      userRooms.forEach((r) => {
        socket.to(r._id.toString()).emit("server:user_offline", {
          user: updatedUser._id.toString(),
          status: "offline",
          lastSeen: updatedUser.lastSeen,
        });
      });
    }
    console.log("User Disconnected:", authSocket.userId);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
