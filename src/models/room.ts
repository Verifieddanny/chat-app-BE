import { Schema, Types, model } from "mongoose";
import type { IUser } from "./user.js";

export interface IRoom {
  name: string;
  roomType: "private" | "group";
  roomMembers: Types.ObjectId[] | IUser[];
  creator: Types.ObjectId | IUser;
  roomBio: string;
  roomDisplayPicture: string;
  createdAt: string;
  updatedAt: string;
}

const Room = new Schema<IRoom>(
  {
    name: {
      type: String,
    },
    roomType: {
      type: String,
      enum: ["private", "group"],
      required: true,
    },
    roomMembers: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    creator: {
      type: Types.ObjectId,
      ref: "User",
    },
    roomBio: {
      type: String,
    },
    roomDisplayPicture: {
      type: String,
    },
  },
  { timestamps: true },
);

export default model<IRoom>("Room", Room);
