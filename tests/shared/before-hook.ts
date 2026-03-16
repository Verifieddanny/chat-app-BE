import mongoose from "mongoose";
import user from "../../src/models/user.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import type { IUser } from "../../src/models/user.js";
import room from "../../src/models/room.js";

dotenv.config();

interface SetupOptions {
  createSecondaryUser?: boolean;
}

export const mongooseConnect = async (
  options: SetupOptions = {},
): Promise<{
  testUser: IUser & { _id: string };
  dummyUser?: (IUser & { _id: string }) | undefined;
}> => {
  const state = mongoose.connection.readyState;
  if (state === 0 || state === 3) {
    if (state === 3) {
      await new Promise((resolve) =>
        mongoose.connection.once("disconnected", resolve),
      );
    }
    await mongoose.connect(process.env.TEST_MONGODB_URL!);
  } else if (state === 2) {
    await new Promise((resolve) =>
      mongoose.connection.once("connected", resolve),
    );
  }

  await user.deleteMany({});
  await room.deleteMany({});

  //   await urlShortner.deleteMany({});

  const hashedPassword = await bcrypt.hash("1234567890", 12);

  const userInMem = new user({
    firstName: "Test Name",
    lastName: "Test Name",
    username: "devTester",
    email: "test@test.com",
    password: hashedPassword,
  });

  const savedUser = await userInMem.save();

  const formattedUser = {
    ...savedUser.toObject(),
    _id: savedUser._id.toString(),
  } as IUser & { _id: string };

  if (options.createSecondaryUser) {
    const otherUser = new user({
      username: "otherGuy",
      email: "other@test.com",
      password: "hashedPassword",
      firstName: "Other",
      lastName: "User",
    });
    const formatDummyUser = await otherUser.save();
    return {
      testUser: formattedUser,
      dummyUser: {
        ...formatDummyUser.toObject(),
        _id: formatDummyUser._id.toString(),
      },
    };
  }

  // Return the object that matches your Promise definition
  return {
    testUser: formattedUser,
  };
};
