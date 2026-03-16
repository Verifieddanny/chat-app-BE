import { body } from "express-validator";

export const createRoomValidation = [
  body("name")
    .optional({ checkFalsy: true })
    .isLength({ min: 3 })
    .withMessage("Must be at least 3 chars"),
  body("roomType").isIn(["private", "group"]).withMessage("Invalid room type"),
  body("roomBio")
    .optional({ checkFalsy: true })
    .isLength({ min: 50, max: 300 })
    .withMessage("Must be at least 50 chars and at most 300 chars"),
  body("roomDisplayPicture")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Put a valid image url"),
  body("recipientId").optional({ checkFalsy: true }).isLength({ min: 8 }),
];

export const addOrRemoveMemberValidation = [
  body("recipientId").isLength({ min: 8 }),
];

export const updateRoomValidation = [
  body("name")
    .optional({ checkFalsy: true })
    .isLength({ min: 3 })
    .withMessage("Must be at least 3 chars"),
  body("roomBio")
    .optional({ checkFalsy: true })
    .isLength({ min: 50, max: 300 })
    .withMessage("Must be at least 50 chars and at most 300 chars"),
  body("roomDisplayPicture")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Put a valid image url"),
];
