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

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "welcome to chat app BE" });
});

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
  const userId = authSocket.userId;

  if (!userId) {
    console.log("Connection rejected: No User ID");
    return socket.disconnect();
  }
  console.log("User connected:", userId);

  const userRooms = await getAllUserRooms(userId || "");

  userRooms.forEach((r) => {
    socket.join(r._id.toString());
    socket.to(r._id.toString()).emit("server:user_online", {
      userId: userId,
      status: "online",
    });
  });

  const onlineIds = Array.from(io.sockets.sockets.values())
    .map((s) => (s as any).userId)
    .filter((id) => id && id !== userId);

  socket.emit("server:initial_online_users", onlineIds);

  console.log(`Joined ${userRooms.length} rooms`);

  socket.join(userId?.toString() || "");

  socket.on("client:send_message", async (args: SendMessageEvent) => {
    try {
      const savedMessage = await saveMessage(
        args.roomId,
        args.content,
        userId || "",
      );

      const payload = {
        ...savedMessage,
        roomId: args.roomId,
        timeStamp: new Date().toISOString(),
      };

      io.to(args.roomId).emit("server:new_message", payload);

      const RoomModel = (await import("./models/room.js")).default;
      const roomData = await RoomModel.findById(args.roomId);

      if (roomData) {
        roomData.roomMembers.forEach((memberId) => {
          io.to(memberId.toString()).emit("server:new_message", payload);
        });
      }
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  });

  socket.on("client:read_receipt", async (args: ReadReceipt) => {
    try {
      const updatedMessage = await addUserToViewedBy(
        args.messageId,
        userId || "",
      );
      if (updatedMessage) {
        const roomIdStr = args.roomId;
        io.to(roomIdStr).emit("server:viewed_message", {
          messageId: args.messageId,
          roomId: roomIdStr,
          viewedBy: updatedMessage.viewedBy,
        });
      }
    } catch (error) {
      console.error("Read receipt error:", error);
    }
  });

  socket.on("client:is_typing", (args: ClientTyping) => {
    socket.to(args.roomId.toString()).emit("server:user_typing", {
      roomId: args.roomId,
      userId: userId,
    });
  });

  socket.on("client:join_room", (args: { roomId: string }) => {
    socket.join(args.roomId);
    console.log(`User ${userId} manually joined room: ${args.roomId}`);
  });

  socket.on(
    "client:group_update",
    async (args: {
      roomId: string;
      updateType: "member_added" | "member_removed" | "left" | "join" | "group_update";
      recipientId?: string;
    }) => {
      io.to(args.roomId).emit("server:group_updated", { roomId: args.roomId });

      const RoomModel = (await import("./models/room.js")).default;
      const roomData = await RoomModel.findById(args.roomId);

      if (roomData) {
        roomData.roomMembers.forEach((memberId) => {
          io.to(memberId.toString()).emit("server:group_updated", { roomId: args.roomId });
        });
      }
      
      if (args.updateType === "member_added" && args.recipientId) {
        io.to(args.recipientId).emit("server:added_to_group", { roomId: args.roomId });
      }
    },
  );

  socket.on("disconnect", async () => {
    const updatedUser = await updateLastSeen(userId || "");
    if (updatedUser) {
      userRooms.forEach((r) => {
        socket.to(r._id.toString()).emit("server:user_offline", {
          userId: updatedUser._id.toString(),
          status: "offline",
          lastSeen: updatedUser.lastSeen,
        });
      });
    }
    console.log("User Disconnected:", userId);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
