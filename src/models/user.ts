import { Schema, model } from "mongoose";

export interface IUser {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  displayPicture: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

const User = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    displayPicture: {
      type: String,
    },
    lastSeen: {
      type: String,
    }
  },
  { timestamps: true },
);

export default model<IUser>("User", User);
