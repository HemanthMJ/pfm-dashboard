const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
} = require("../controllers/budgetController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getBudgets);
router.post("/", createOrUpdateBudget);
router.delete("/:id", deleteBudget);

module.exports = router;
