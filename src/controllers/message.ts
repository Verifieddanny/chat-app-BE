import type { NextFunction, Response } from "express";
import type { AuthRequest, CustomError } from "../shared/types.js";
import room from "../models/room.js";
import message from "../models/message.js";
import type { IUser } from "../models/user.js";

const pageSize = 15;

export const getRoomMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const activeUser = req.userId;
    const roomId = req.params.roomId;
    const currentPage = Number(req.query.page) || 1;

    if (!roomId || !activeUser) {
      return res
        .status(400)
        .json({ message: "Missing Room ID or User authentication" });
    }

    const isMember = await room.findOne({
      _id: roomId,
      roomMembers: activeUser,
    });

    if (!isMember) {
      return res
        .status(404)
        .json({ message: "Room not found or access denied" });
    }

    const messages = await message
      .find({ to: roomId })
      .sort({ createdAt: -1 })
      .skip((+currentPage - 1) * pageSize)
      .limit(pageSize)
      .populate<{ from: IUser }>("from", "username displayPicture")
      .populate("viewedBy.user", "username displayPicture");

    res.status(200).json({ message: "Message history fetched", messages });
  } catch (error) {
    const err = error as CustomError;
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};
