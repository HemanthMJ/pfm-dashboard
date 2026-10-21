const express = require("express");
const { body } = require("express-validator");
const { register, login, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const emailValidation = body("email")
  .isEmail()
  .withMessage("Enter a valid email address")
  .normalizeEmail();

router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must contain 2 to 100 characters"),
    emailValidation,
    body("password")
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must contain 8 to 128 characters")
  ],
  register
);

router.post(
  "/login",
  [
    emailValidation,
    body("password")
      .isString()
      .notEmpty()
      .withMessage("Password is required")
  ],
  login
);

router.get("/me", authMiddleware, getMe);

module.exports = router;
