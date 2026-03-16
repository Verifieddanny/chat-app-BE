import { expect, assert } from "../setup.js";
import * as sinon from "sinon";
import { mongooseConnect } from "../shared/before-hook.js";
import user, { type IUser } from "../../src/models/user.js";
import room from "../../src/models/room.js";
import message from "../../src/models/message.js";
import { saveMessage } from "../../src/shared/helper.js";
import type { AuthRequest } from "../../src/shared/types.js";
import type { TestResponse } from "../shared/type.js";
import { getRoomMessage } from "../../src/controllers/message.js";

describe("Message Controller", () => {
  let testUser: IUser & { _id: string };
  let dummyUser: IUser & { _id: string };
  let roomId: string;

  before(async () => {
    const result = await mongooseConnect({ createSecondaryUser: true });
    testUser = result.testUser;

    if (result.dummyUser) {
      dummyUser = result.dummyUser;
    }

    await user.deleteMany({});
    await room.deleteMany({});
    await message.deleteMany({});
  });

  it("Should save and retrive all messages", async () => {
    const newRoom = new room({
      name: "The Boys",
      roomType: "group",
      creator: testUser._id,
      roomMembers: [testUser._id],
    });

    const savedmessage = await newRoom.save();

    roomId = savedmessage._id.toString();

    await saveMessage(roomId, "Message sent 1", testUser._id.toString());
    const req = {
      userId: testUser._id,
      params: {
        roomId: roomId,
      },
      query: {},
    } as unknown as AuthRequest;

    const res = {
      statusCode: 500,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; messages: [] }) {
        this.message = data.message;
        this.messagesLength = data.messages.length;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await getRoomMessage(req, res, () => {});

    const responseData = res.json.getCall(0).args[0];

    expect(res.json.calledOnce).to.be.true;
    assert.equal(res.statusCode, 200);
    assert.equal(responseData.message, "Message history fetched");
    assert.equal(responseData.messages.length, 1);
  });

  it("SHould yield an unathorized message to get message as good non-memeber", async () => {
    const req = {
      userId: dummyUser._id,
      params: {
        roomId: roomId,
      },
      query: {},
    } as unknown as AuthRequest;

    const res = {
      statusCode: 500,
      status(code) {
        this.statusCode = code;
        return this;
      },
    } as TestResponse;

    await getRoomMessage(req, res, () => {});

    assert.equal(res.statusCode, 404);
  });
});
