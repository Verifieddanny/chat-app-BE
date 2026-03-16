import { expect } from "chai";
import * as sinon from "sinon";
import { io as ioc, type Socket as ClientSocket } from "socket.io-client";
import { server } from "../../src/index.js";
import jwt from "jsonwebtoken";
import helpers from "../../src/shared/helper.js";
import type { IRoom } from "../../src/models/room.js";
import { Types } from "mongoose";

describe("Socket.io Tests", () => {
  let clientSocket: ClientSocket;
  const port = 8080;

  const signToken = (id: string) => {
    return jwt.sign({ userId: id }, process.env.SECRETE_KEY || "test_secret");
  };

  after(() => {
    server.close();
  });

  afterEach(() => {
    if (clientSocket) clientSocket.disconnect();
    sinon.restore();
  });

  it("Scenario 1: Should allow connection with valid token", (done) => {
    const validToken = signToken("user_123");

    clientSocket = ioc(`http://localhost:${port}`, {
      auth: { token: validToken },
    });

    clientSocket.on("connect", () => {
      expect(clientSocket.connected).to.be.true;
      done();
    });

    clientSocket.on("connect_error", (err) => {
      done(err);
    });
  });

  it("Scenario 2: User B should see when User A comes online", async () => {
    const userA_Id = "user_AAA";
    const userB_Id = "user_BBB";
    const mockRoomId = new Types.ObjectId();
    const roomIdStr = mockRoomId.toString();

    sinon.stub(helpers, "getAllUserRooms").resolves([
      { _id: mockRoomId },
    ] as unknown as (IRoom & {
      _id: Types.ObjectId;
    })[]);

    const clientB = ioc(`http://localhost:${port}`, {
      auth: { token: signToken(userB_Id) },
    });

    await new Promise((resolve) => {
      clientB.on("connect", () => {
        console.log("User B connected");
        resolve(true);
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const eventPromise = new Promise((resolve, reject) => {
      clientB.on("server:user_online", (data) => {
        try {
          expect(data.user).to.equal(userA_Id);
          expect(data.status).to.equal("online");
          resolve(true);
        } catch (e) {
          reject(e);
        }
      });
      setTimeout(
        () => reject(new Error("User B never saw User A come online")),
        3000,
      );
    });

    const clientA = ioc(`http://localhost:${port}`, {
      auth: { token: signToken(userA_Id) },
    });

    await eventPromise;

    clientA.disconnect();
    clientB.disconnect();
  });
});
