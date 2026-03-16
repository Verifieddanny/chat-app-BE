import type { NextFunction, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthRequest, CustomError } from "../shared/types.js";
import room from "../models/room.js";
import type { IUser } from "../models/user.js";

export const createRoom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error: CustomError = new Error(
        "Validation failed, entered data is incorrect.",
      );
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const creator = req.userId;
    const name = req.body.name;
    const roomType = req.body.roomType as "private" | "group";
    const roomBio = req.body.roomBio;
    const roomDisplayPicture = req.body.roomDisplayPicture;
    const recipientId = req.body.recipientId;

    const roomMembers =
      roomType === "private" ? [creator, recipientId] : [creator];

    if (roomType === "private") {
      const existingRoom = await room.findOne({
        roomType: "private",
        roomMembers: { $all: [creator, recipientId] },
      });

      if (existingRoom) {
        return res.status(200).json({
          message: "Room already exists",
          roomId: existingRoom._id.toString(),
        });
      }
    }

    const newRoom = new room({
      name,
      roomType,
      roomMembers,
      creator,
      roomBio,
      roomDisplayPicture,
    });

    await newRoom.save();

    res.status(201).json({
      message: "room created",
      roomId: newRoom._id.toString(),
      groupName: newRoom.name,
      roomType: newRoom.roomType,
      roomBio: newRoom.roomBio,
      creator: newRoom.creator.toString(),
      roomMembers: newRoom.roomMembers,
    });
  } catch (error) {
    const err = error as CustomError;
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

export const getAllRooms = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const activeUser = req.userId;

    if (!activeUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const rooms = await room.find({ roomMembers: activeUser }).populate<{
      roomMembers: IUser[];
    }>("roomMembers", "username displayPicture");

    res.status(200).json({
      message: rooms.length ? "rooms fetched" : "No rooms found",
      rooms,
    });
  } catch (error) {
    const err = error as CustomError;
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

export const getRoom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roomId = req.params.roomId;
    const activeUser = req.userId;

    if (!roomId || !activeUser) {
      return res
        .status(400)
        .json({ message: "Missing Room ID or User authentication" });
    }

    const activeRoom = await room.findOne({
      _id: roomId,
      roomMembers: { $in: [activeUser] },
    });

    res.status(200).json({
      message: "Room fetched",
      activeRoom,
    });
  } catch (error) {
    const err = error as CustomError;
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

export const addMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error: CustomError = new Error(
        "Validation failed, entered data is incorrect.",
      );
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const roomId = req.params.roomId;
    const newMember = req.body.recipientId;

    const updatedRoom = await room
      .findByIdAndUpdate(
        roomId,
        { $addToSet: { roomMembers: newMember } },
        { returnDocument: "after" },
      )
      .populate<{
        roomMembers: IUser[];
      }>("roomMembers", "username displayPicture");

    if (!updatedRoom) {
      return res
        .status(403)
        .json({ message: "You can't add members to private chat" });
    }

    res.status(200).json({
      message: "User added",
      updatedRoom,
    });
  } catch (error) {
    const err = error as CustomError;
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

export const removeUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error: CustomError = new Error(
        "Validation failed, entered data is incorrect.",
      );
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const roomId = req.params.roomId;
    const memberToRemove = req.body.recipientId;
    const activeUser = req.userId;

    if (!roomId || !activeUser || !memberToRemove) {
      return res.status(400).json({ message: "Missing required IDs" });
    }

    const updatedRoom = await room.findOneAndUpdate(
      { _id: roomId, creator: activeUser },
      { $pull: { roomMembers: memberToRemove } },
      { returnDocument: "after" },
    );

    if (!updatedRoom) {
      return res
        .status(403)
        .json({ message: "Only admin can perform such operation" });
    }

    res.status(200).json({ message: "User removed successfully" });
  } catch (error) {
    const err = error as CustomError;
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

export const joinRoom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roomId = req.params.roomId;
    const activeUser = req.userId;

    const joinedRoom = await room
      .findByIdAndUpdate(
        roomId,
        { $addToSet: { roomMembers: activeUser } },
        { returnDocument: "after" },
      )
      .populate<{
        roomMembers: IUser[];
      }>("roomMembers", "username displayPicture");

    if (!joinedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.status(200).json({
      message: "user joined",
      roomData: joinedRoom,
    });
  } catch (error) {
    const err = error as CustomError;
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

export const leaveRoom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roomId = req.params.roomId;
    const activeUser = req.userId;

    const joinedRoom = await room.findByIdAndUpdate(
      roomId,
      { $pull: { roomMembers: activeUser } },
      { returnDocument: "after" },
    );

    if (!joinedRoom) {
      res.status(404).json({ message: "You are not a member of this room" });
    }

    res.status(200).json({ message: "You left the room" });
  } catch (error) {
    const err = error as CustomError;
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

export const updateRoomDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error: CustomError = new Error(
        "Validation failed, entered data is incorrect.",
      );
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const roomId = req.params.roomId;
    const creator = req.userId;
    const name = req.body.name;
    const roomBio = req.body.roomBio;
    const roomDisplayPicture = req.body.roomDisplayPicture;

    if (!roomId || !creator) {
      return res.status(400).json({ message: "Missing required ID" });
    }

    const updatedRoom = await room.findOneAndUpdate(
      { _id: roomId, creator },
      {
        name,
        roomBio,
        roomDisplayPicture,
      },
      { returnDocument: "after" },
    );

    if (!updatedRoom) {
      return res.status(403).json({message: "Only Admin can update group details"});
    }

    res.status(200).json({ message: "room updated", updatedRoom });
  } catch (error) {
    const err = error as CustomError;
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};
