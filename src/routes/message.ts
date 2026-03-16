import { Router } from "express";
import { isAuth } from "../middleware/is-auth.js";


const MessageRouter = Router();

MessageRouter.get("/:roomId", isAuth, () => {})



export default MessageRouter;