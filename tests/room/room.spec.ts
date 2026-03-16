import { expect, assert } from "../setup.js";
import * as sinon from "sinon";
import { mongooseConnect } from "../shared/before-hook.js";
import user, { type IUser } from "../../src/models/user.js";
import room from "../../src/models/room.js";
import type { AuthRequest } from "../../src/shared/types.js";
import {
  addMember,
  createRoom,
  getAllRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  removeUser,
  updateRoomDetails,
} from "../../src/controllers/room.js";
import type { TestResponse } from "../shared/type.js";

describe("Room Controller", () => {
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
  });

  it("Should yield a group room", async () => {
    const req = {
      userId: testUser._id.toString(),
      body: {
        name: "The boys",
        roomType: "group",
        roomBio:
          "just a test that test a test to check if the test yields the expected results",
      },
    } as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: {
        message: string;
        creator: string;
        groupName: string;
        _roomId: string;
        _roomType: string;
        _roomBio: string;
        _roomMembers: [];
      }) {
        this.message = data.message;
        this.creator = data.creator.toString();
        this.groupName = data.groupName;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await createRoom(req, res, () => {});

    const responseData = res.json.getCall(0).args[0];

    expect(res.json.calledOnce).to.be.true;
    assert.equal(res.statusCode, 201);
    assert.equal(responseData.message, "room created");
    assert.equal(responseData.creator, req.userId?.toString());
    assert.equal(responseData.groupName, "The boys");
  });

  it("Should yield a private room", async () => {
    const req = {
      userId: testUser._id.toString(),
      body: {
        roomType: "private",
        recipientId: dummyUser._id.toString(),
      },
    } as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: {
        message: string;
        _creator: string;
        _groupName: string;
        _roomId: string;
        _roomType: string;
        _roomBio: string;
        _roomMembers: [];
      }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await createRoom(req, res, () => {});

    const responseData = res.json.getCall(0).args[0];

    expect(res.json.calledOnce).to.be.true;
    assert.equal(res.statusCode, 201);
    assert.equal(responseData.message, "room created");
  });

  it("Should yield an existing private room with a Room already exists message", async () => {
    const req = {
      userId: testUser._id.toString(),
      body: {
        roomType: "private",
        recipientId: dummyUser._id.toString(),
      },
    } as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; _roomId: string }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await createRoom(req, res, () => {});

    const responseData = res.json.getCall(0).args[0];

    expect(res.json.calledOnce).to.be.true;
    assert.equal(res.statusCode, 200);
    assert.equal(responseData.message, "Room already exists");
  });

  it("Should return all rooms of a user", async () => {
    const req = {
      userId: testUser._id.toString(),
    } as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; rooms: [] }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await getAllRooms(req, res, () => {});

    const responseData = res.json.getCall(0).args[0];
    expect(res.json.calledOnce).to.be.true;
    assert.equal(res.statusCode, 200);
    assert.equal(responseData.message, "rooms fetched");
  });

  it("Should return 500 error for invalid user id", async () => {
    const req = {
      userId: "invalid-user-id",
    } as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; rooms: [] }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    await getAllRooms(req, res, () => {});

    assert.equal(res.statusCode, 500);
  });

  it("Should return 401 error for no userId passed in", async () => {
    const req = {
      userId: "",
    } as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; rooms: [] }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await getAllRooms(req, res, () => {});

    const responseData = res.json.getCall(0).args[0];
    expect(res.json.calledOnce).to.be.true;
    assert.equal(res.statusCode, 401);
    assert.equal(responseData.message, "Not authenticated");
  });

  it("Should return no rooms of a user when user is not member of any room", async () => {
    await room.deleteMany({});
    const req = {
      userId: testUser._id.toString(),
    } as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; rooms: [] }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await getAllRooms(req, res, () => {});

    const responseData = res.json.getCall(0).args[0];
    expect(res.json.calledOnce).to.be.true;
    assert.equal(res.statusCode, 200);
    assert.equal(responseData.message, "No rooms found");
  });

  it("should return a fetched room", async () => {
    const req = {
      userId: testUser._id.toString(),
      body: {
        name: "The boys",
        roomType: "group",
        roomBio:
          "just a test that test a test to check if the test yields the expected results",
      },
    } as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: {
        message: string;
        creator: string;
        groupName: string;
        _roomId: string;
        _roomType: string;
        _roomBio: string;
        _roomMembers: [];
      }) {
        this.message = data.message;
        this.creator = data.creator.toString();
        this.groupName = data.groupName;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await createRoom(req, res, () => {});
    const responseData = res.json.getCall(0).args[0];
    roomId = responseData.roomId;

    const getRoomReq = {
      userId: testUser._id.toString(),
      params: {
        roomId: roomId,
      },
    } as unknown as AuthRequest;

    const getRoomRes = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; _activeRoom: {} }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    getRoomRes.json = sinon.spy();

    await getRoom(getRoomReq, getRoomRes, () => {});

    const getRoomResponseData = getRoomRes.json.getCall(0).args[0];

    expect(getRoomRes.json.calledOnce).to.be.true;
    assert.equal(getRoomRes.statusCode, 200);
    assert.equal(getRoomResponseData.message, "Room fetched");
  });

  it("should return 400 if no roomId or userId", async () => {
    const getRoomReq = {
      userId: testUser._id.toString(),
      params: {
        roomId: "",
      },
    } as unknown as AuthRequest;

    const getRoomRes = {
      statusCode: 500,
      message: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; _activeRoom: {} }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    await getRoom(getRoomReq, getRoomRes, () => {});

    assert.equal(getRoomRes.statusCode, 400);
  });

  it("should return 500 if no valid roomId", async () => {
    const getRoomReq = {
      userId: testUser._id.toString(),
      params: {
        roomId: "invalid-room-id",
      },
    } as unknown as AuthRequest;

    const getRoomRes = {
      statusCode: 500,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { _message: string; _activeRoom: {} }) {
        return this;
      },
    } as TestResponse;

    await getRoom(getRoomReq, getRoomRes, () => {});

    assert.equal(getRoomRes.statusCode, 500);
  });

  it("should add member", async () => {
    const addRoomReq = {
      userId: testUser._id.toString(),
      params: {
        roomId: roomId,
      },
      body: {
        recipientId: dummyUser._id.toString(),
      },
    } as unknown as AuthRequest;

    const addRoomRes = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; _updatedRoom: {} }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    addRoomRes.json = sinon.spy();
    await addMember(addRoomReq, addRoomRes, () => {});

    const responseData = addRoomRes.json.getCall(0).args[0];

    expect(addRoomRes.json.calledOnce).to.be.true;
    assert.equal(responseData.message, "User added");
    assert.equal(addRoomRes.statusCode, 200);
  });

  it("should remove member", async () => {
    const addRoomReq = {
      userId: testUser._id.toString(),
      params: {
        roomId: roomId,
      },
      body: {
        recipientId: dummyUser._id.toString(),
      },
    } as unknown as AuthRequest;

    const addRoomRes = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    addRoomRes.json = sinon.spy();
    await removeUser(addRoomReq, addRoomRes, () => {});

    const responseData = addRoomRes.json.getCall(0).args[0];

    expect(addRoomRes.json.calledOnce).to.be.true;
    assert.equal(responseData.message, "User removed successfully");
    assert.equal(addRoomRes.statusCode, 200);
  });

  it("should returun unathorized when removing member", async () => {
    const req = {
      userId: testUser._id.toString(),
      params: {
        roomId: roomId,
      },
      body: {
        recipientId: dummyUser._id.toString(),
      },
    } as unknown as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; _updatedRoom: {} }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    await addMember(req, res, () => {});

    const addRoomReq = {
      userId: dummyUser._id.toString(),
      params: {
        roomId: roomId,
      },
      body: {
        recipientId: testUser._id.toString(),
      },
    } as unknown as AuthRequest;

    const addRoomRes = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    addRoomRes.json = sinon.spy();
    await removeUser(addRoomReq, addRoomRes, () => {});

    const responseData = addRoomRes.json.getCall(0).args[0];

    expect(addRoomRes.json.calledOnce).to.be.true;
    assert.equal(responseData.message, "Only admin can perform such operation");
    assert.equal(addRoomRes.statusCode, 403);
  });

  it("should allow user join room", async () => {
    //I need to remove the user first
    const addRoomReq = {
      userId: testUser._id.toString(),
      params: {
        roomId: roomId,
      },
      body: {
        recipientId: dummyUser._id.toString(),
      },
    } as unknown as AuthRequest;

    const addRoomRes = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    await removeUser(addRoomReq, addRoomRes, () => {});

    const req = {
      userId: dummyUser._id.toString(),
      params: {
        roomId: roomId,
      },
    } as unknown as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; _roomdata: {} }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await joinRoom(req, res, () => {});

    const responseData = res.json.getCall(0).args[0];

    expect(res.json.calledOnce).to.be.true;
    assert.equal(res.statusCode, 200);
    assert.equal(responseData.message, "user joined");
  });

  it("should allow user leave room", async () => {
    const req = {
      userId: dummyUser._id.toString(),
      params: {
        roomId: roomId,
      },
    } as unknown as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; _roomdata: {} }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await leaveRoom(req, res, () => {});

    const responseData = res.json.getCall(0).args[0];

    expect(res.json.calledOnce).to.be.true;
    assert.equal(res.statusCode, 200);
    assert.equal(responseData.message, "You left the room");
  });

  it("should update room details", async () => {
    const req = {
      userId: testUser._id.toString(),
      params: {
        roomId: roomId,
      },
      body: {
        name: "The boys updated",
      },
    } as unknown as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; updatedRoom: {} }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await updateRoomDetails(req, res, () => {});

    const responseData = res.json.getCall(0).args[0];

    expect(res.json.calledOnce).to.be.true;
    assert.equal(responseData.message, "room updated");
    assert.equal(res.statusCode, 200);
  });

  it("should return unauthorized when group member update room details", async () => {
    const addRoomReq = {
      userId: testUser._id.toString(),
      params: {
        roomId: roomId,
      },
      body: {
        recipientId: dummyUser._id.toString(),
      },
    } as unknown as AuthRequest;

    const addRoomRes = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; _updatedRoom: {} }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    await addMember(addRoomReq, addRoomRes, () => {});

    const req = {
      userId: dummyUser._id.toString(),
      params: {
        roomId: roomId,
      },
      body: {
        name: "The boys updated",
      },
    } as unknown as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      groupName: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; updatedRoom: {} }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await updateRoomDetails(req, res, () => {});

    const responseData = res.json.getCall(0).args[0];

    expect(res.json.calledOnce).to.be.true;
    assert.equal(responseData.message, "Only Admin can update group details");
    assert.equal(res.statusCode, 403);
  });
});
