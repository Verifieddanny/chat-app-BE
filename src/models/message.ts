import { Schema, Types, model } from "mongoose";
import type { IUser } from "./user.js";
import type { IRoom } from "./room.js";

export interface IMessage {
  content: string;
  from: Types.ObjectId | IUser;
  to: Types.ObjectId | IRoom;
  viewedBy: {
    user: Types.ObjectId | IUser;
    read: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

const Message = new Schema<IMessage>(
  {
    content: {
      type: String,
      required: true,
    },
    from: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: Types.ObjectId,
      ref: "Room",
      required: true,
    },
    viewedBy: [
      {
        user: {
          type: Types.ObjectId,
          ref: "User",
        },
        read: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true },
);

export default model<IMessage>("Message", Message);
