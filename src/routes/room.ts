import { Router } from "express";
import { isAuth } from "../middleware/is-auth.js";
import {
  addMember,
  createRoom,
  getAllRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  removeUser,
  updateRoomDetails,
} from "../controllers/room.js";
import {
  addOrRemoveMemberValidation,
  createRoomValidation,
  updateRoomValidation,
} from "../validation/room.js";

const RoomRouter = Router();

RoomRouter.post("/", isAuth, createRoomValidation, createRoom);

RoomRouter.get("/all", isAuth, getAllRooms);

RoomRouter.get("/:roomId", isAuth, getRoom);

RoomRouter.put("/:roomId/add", isAuth, addOrRemoveMemberValidation, addMember);

RoomRouter.put(
  "/:roomId/remove",
  isAuth,
  addOrRemoveMemberValidation,
  removeUser,
);

RoomRouter.put("/:roomId/join", isAuth, joinRoom);

RoomRouter.put("/:roomId/leave", isAuth, leaveRoom);

RoomRouter.put("/:roomId", isAuth, updateRoomValidation, updateRoomDetails);
export default RoomRouter;
