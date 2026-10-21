const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

const ALLOWED_CATEGORIES = [
  "Food and Dining",
  "Shopping",
  "Transportation",
  "Housing",
  "Bills and Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Travel",
  "Salary",
  "Freelance",
  "Investment",
  "Other",
];

function getMonthRange(month) {
  const [year, monthNumber] = month.split("-").map(Number);

  return {
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
    end: new Date(Date.UTC(year, monthNumber, 1)),
  };
}

function validateMonth(month) {
  return (
    typeof month === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
  );
}

async function getBudgets(req, res) {
  try {
    const month = req.query.month;

    if (!validateMonth(month)) {
      return res.status(400).json({
        message: "Provide a month using YYYY-MM format",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const budgets = await Budget.find({
      userId,
      month,
    }).sort({ category: 1 });

    const { start, end } = getMonthRange(month);

    const spending = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "expense",
          date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: "$category",
          spent: { $sum: "$amount" },
        },
      },
    ]);

    const spendingMap = new Map(
      spending.map((item) => [item._id, item.spent])
    );

    const results = budgets.map((budget) => {
      const spent = spendingMap.get(budget.category) || 0;
      const remaining = budget.monthlyLimit - spent;

      return {
        ...budget.toObject(),
        spent,
        remaining,
        percentageUsed:
          budget.monthlyLimit > 0
            ? Math.round((spent / budget.monthlyLimit) * 100)
            : 0,
        exceeded: spent > budget.monthlyLimit,
      };
    });

    return res.json({
      budgets: results,
    });
  } catch (error) {
    console.error("Get budgets error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve budgets",
    });
  }
}

async function createOrUpdateBudget(req, res) {
  try {
    const { category, monthlyLimit, month, currency } = req.body;

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: "Please select a valid category",
      });
    }

    if (
      monthlyLimit === undefined ||
      monthlyLimit === null ||
      monthlyLimit === "" ||
      !Number.isFinite(Number(monthlyLimit)) ||
      Number(monthlyLimit) <= 0
    ) {
      return res.status(400).json({
        message: "Monthly limit must be a positive number",
      });
    }

    if (!validateMonth(month)) {
      return res.status(400).json({
        message: "Month must use YYYY-MM format",
      });
    }

    if (
      currency !== undefined &&
      (typeof currency !== "string" ||
        !/^[A-Z]{3}$/.test(currency))
    ) {
      return res.status(400).json({
        message: "Currency must be a three-letter code",
      });
    }

    const budget = await Budget.findOneAndUpdate(
      {
        userId: req.user.userId,
        category,
        month,
      },
      {
        $set: {
          monthlyLimit: Number(monthlyLimit),
          currency: currency || "USD",
        },
        $setOnInsert: {
          userId: req.user.userId,
          category,
          month,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      message: "Budget saved successfully",
      budget,
    });
  } catch (error) {
    console.error("Save budget error:", error.message);

    return res.status(500).json({
      message: "Unable to save budget",
    });
  }
}

async function deleteBudget(req, res) {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    return res.json({
      message: "Budget deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid budget ID",
      });
    }

    console.error("Delete budget error:", error.message);

    return res.status(500).json({
      message: "Unable to delete budget",
    });
  }
}

module.exports = {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
};
