import type { Types } from "mongoose";
import type { IRoom } from "../models/room.js";
import room from "../models/room.js";
import message, { type IMessage } from "../models/message.js";
import type { IUser } from "../models/user.js";
import user from "../models/user.js";

export const getAllUserRooms = async (
  userId: string,
): Promise<(IRoom & { _id: Types.ObjectId })[]> => {
  return await room.find({ roomMembers: userId });
};

export const saveMessage = async (
  roomId: string,
  content: string,
  userId: string,
): Promise<IMessage> => {
  const newMessage = new message({
    content,
    from: userId,
    to: roomId,
  });

  await newMessage.save();

  return newMessage;
};

export const addUserToViewedBy = async (messageId: string, userId: string) => {
  const updatedMessage = await message
    .findByIdAndUpdate(
      messageId,
      {
        $addToSet: {
          viewedBy: {
            user: userId,
            read: new Date().toISOString(),
          },
        },
      },
      { returnDocument: "after" },
    )
    .populate<{
      viewedBy: {
        user: Pick<IUser, "username" | "displayPicture">;
        read: string;
      }[];
    }>("viewedBy.user", "username displayPicture");

  return updatedMessage;
};

export const updateLastSeen = async (userId: string) => {
  const updatedUser = await user.findByIdAndUpdate(
    userId,
    { lastSeen: new Date().toISOString() },
    { returnDocument: "after" },
  );
  return updatedUser;
};

const helpers = {
  getAllUserRooms,
  saveMessage,
  addUserToViewedBy,
  updateLastSeen,
};

export default helpers;
