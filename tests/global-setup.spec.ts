import mongoose from "mongoose";
import room from "../src/models/room.js";
import user from "../src/models/user.js";

after(async () => {
  console.log("Cleaning up global database connection...");

  await user.deleteMany({});
  await room.deleteMany({});

  await mongoose.connection.close();
});
