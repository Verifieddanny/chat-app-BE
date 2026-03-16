import { expect } from "../setup.js";
import * as sinon from "sinon";
import user from "../../src/models/user.js";
import type { IUser } from "../../src/models/user.js";
import { login, signUp } from "../../src/controllers/auth.js";
import type { Request, Response } from "express";
import type { TestResponse } from "../shared/type.js";
import { mongooseConnect } from "../shared/before-hook.js";

describe("Auth Controller - SignUp", () => {
  before(async () => {
    await mongooseConnect();
    await user.deleteMany({});
  });

  it("should throw an error with code 500 if accessing the database fails", async () => {
    const userStub = sinon.stub(user, "findOne");
    userStub.throws();

    const req = {
      body: {
        firstName: "Test Name",
        lastName: "Test Name",
        username: "devTester",
        email: "test@test.com",
        password: "1234567890",
      },
    } as Request;

    const next = sinon.spy();

    await signUp(req, {} as Response, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.have.property("statusCode", 500);

    userStub.restore();
  });

  it("should create new user", async () => {
    const totalUser = await user.countDocuments();

    expect(totalUser).to.be.equals(1);
  });
});

describe("Auth Controller - Login", () => {
  let testUser: IUser & { _id: string };
  before(async () => {
    const result = await mongooseConnect();
    testUser = result.testUser;
  });

  it("should throw an error with code 401 if user is not authenticated", async () => {
    const req = {
      body: {
        username: "devTester2",
        password: "1234567890",
      },
    } as Request;

    const next = sinon.spy();

    await login(req, {} as Response, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.have.property("statusCode", 401);
  });

  it("should return a jwt and userId", async () => {
    const req = {
      body: {
        username: "devTester",
        password: "1234567890",
      },
    } as Request;

    const res = {
      statusCode: 500,
      auth_token: "",
      loadedUser: "",
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: { auth_token: string; userId: string }) {
        this.auth_token = data.auth_token;
        this.loadedUser = data.userId;
      },
    } as TestResponse;

    await login(req, res, () => {});

    expect(res.statusCode).to.equal(200);
    expect(res.loadedUser).to.equal(testUser._id.toString());
  });
});
