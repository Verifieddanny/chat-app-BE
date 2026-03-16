import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { CustomError, UserPayload } from "../shared/types.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import user from "../models/user.js";

export const signUp = async (
  req: Request,
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

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const displayPicture = req.body.displayPicture;

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new user({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      displayPicture,
    });

    const result = await newUser.save();

    res.status(201).json({ message: "user created", user: result._id });
  } catch (error) {
    const err = error as CustomError;

    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

export const login = async (
  req: Request,
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

    const username = req.body.username;
    const password = req.body.password;

    const loadedUser = await user.findOne({ username: username });

    if (!loadedUser) {
      const error: CustomError = new Error(
        "A user with this username is not found",
      );

      error.statusCode = 401;
      throw error;
    }

    const isPasswordMatched = await bcrypt.compare(
      password,
      loadedUser.password,
    );

    if (!isPasswordMatched) {
      const error: CustomError = new Error("Wrong password");
      error.statusCode = 401;
      throw error;
    }

    const payload: UserPayload = {
      email: loadedUser.email,
      userId: loadedUser._id.toString(),
    };

    const signOptions: SignOptions = {
      expiresIn: "1h",
    };

    const token = jwt.sign(payload, process.env.SECRETE_KEY!, signOptions);

    res.status(200).json({
      auth_token: token,
      userId: loadedUser._id.toString(),
      username: loadedUser.username,
      displayPicture: loadedUser.displayPicture || null,
    });
  } catch (error) {
    const err = error as CustomError;
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
