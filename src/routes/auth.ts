import { Router } from "express";
import { findUser, getUserDetails, login, signUp } from "../controllers/auth.js";
import { loginValidation, signUpValidation } from "../validation/auth.js";
import { isAuth } from "../middleware/is-auth.js";

const AuthRouter = Router();

AuthRouter.post("/sign-up", signUpValidation, signUp);

AuthRouter.post("/login", loginValidation, login);

AuthRouter.get("/me", isAuth, getUserDetails);

AuthRouter.get("/users", isAuth, findUser)

export default AuthRouter;
