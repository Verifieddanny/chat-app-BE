import { Router } from "express";
import { login, signUp } from "../controllers/auth.js";
import { loginValidation, signUpValidation } from "../validation/auth.js";

const AuthRouter = Router();

AuthRouter.post("/sign-up", signUpValidation, signUp);

AuthRouter.post("/login", loginValidation, login);

export default AuthRouter;
