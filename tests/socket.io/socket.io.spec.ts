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

});
