import { Router } from "express";
import { isAuth } from "../middleware/is-auth.js";
import { getRoomMessage } from "../controllers/message.js";


const MessageRouter = Router();

MessageRouter.get("/:roomId", isAuth, getRoomMessage)



export default MessageRouter;