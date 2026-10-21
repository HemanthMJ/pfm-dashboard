const mongoose = require("mongoose");
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

const CATEGORY_MAP = {
  FOOD_AND_DRINK: "Food and Dining",
  GENERAL_MERCHANDISE: "Shopping",
  TRANSPORTATION: "Transportation",
  RENT_AND_UTILITIES: "Housing",
  HOME_IMPROVEMENT: "Housing",
  MEDICAL: "Healthcare",
  EDUCATION: "Education",
  TRAVEL: "Travel",
  ENTERTAINMENT: "Entertainment",
  PERSONAL_CARE: "Other",
  GOVERNMENT_AND_NON_PROFIT: "Other",
  BANK_FEES: "Bills and Utilities",
  LOAN_PAYMENTS: "Bills and Utilities",
  INCOME: "Salary",
  TRANSFER_IN: "Other",
  TRANSFER_OUT: "Other",
  OTHER: "Other",
};

function normalizeCategory(category) {
  if (!category) return "Other";

  if (ALLOWED_CATEGORIES.includes(category)) {
    return category;
  }

  const normalized = category.trim().toUpperCase().replace(/[\s&-]+/g, "_");

  if (CATEGORY_MAP[normalized]) {
    return CATEGORY_MAP[normalized];
  }

  const lower = category.toLowerCase();

  if (lower.includes("food") || lower.includes("drink")) {
    return "Food and Dining";
  }

  if (lower.includes("shop") || lower.includes("merchandise")) {
    return "Shopping";
  }

  if (lower.includes("transport") || lower.includes("vehicle")) {
    return "Transportation";
  }

  if (lower.includes("rent") || lower.includes("mortgage")) {
    return "Housing";
  }

  if (lower.includes("utilit") || lower.includes("bill")) {
    return "Bills and Utilities";
  }

  if (lower.includes("medical") || lower.includes("health")) {
    return "Healthcare";
  }

  if (lower.includes("education")) {
    return "Education";
  }

  if (lower.includes("travel")) {
    return "Travel";
  }

  if (lower.includes("entertainment")) {
    return "Entertainment";
  }

  if (lower.includes("salary") || lower.includes("wage")) {
    return "Salary";
  }

  if (lower.includes("freelance")) {
    return "Freelance";
  }

  if (lower.includes("investment")) {
    return "Investment";
  }

  return "Other";
}

function getMonthRange(month) {
  const [year, monthNumber] = month.split("-").map(Number);

  return {
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
    end: new Date(Date.UTC(year, monthNumber, 1)),
  };
}

function getTransactionInput(body) {
  const { merchant, amount, type, category, date, currency } = body;

  if (
    typeof merchant !== "string" ||
    !merchant.trim() ||
    merchant.trim().length > 150
  ) {
    throw new Error("Merchant must contain 1 to 150 characters");
  }

  if (
    amount === undefined ||
    amount === null ||
    amount === "" ||
    !Number.isFinite(Number(amount)) ||
    Number(amount) <= 0
  ) {
    throw new Error("Amount must be a positive number");
  }

  if (!["income", "expense"].includes(type)) {
    throw new Error("Type must be income or expense");
  }

  if (
    category !== undefined &&
    (typeof category !== "string" ||
      !ALLOWED_CATEGORIES.includes(category))
  ) {
    throw new Error("Please select a valid category");
  }

  const parsedDate = new Date(date);

  if (!date || Number.isNaN(parsedDate.getTime())) {
    throw new Error("Please provide a valid transaction date");
  }

  if (
    currency !== undefined &&
    currency !== null &&
    (typeof currency !== "string" ||
      !/^[A-Z]{3}$/.test(currency))
  ) {
    throw new Error("Currency must be a three-letter code");
  }

  return {
    merchant: merchant.trim(),
    amount: Number(amount),
    type,
    category: category || "Other",
    date: parsedDate,
    currency: currency || "USD",
  };
}

function isValidationError(error) {
  return (
    error.message.startsWith("Merchant ") ||
    error.message.startsWith("Amount ") ||
    error.message.startsWith("Type ") ||
    error.message.startsWith("Please select") ||
    error.message.startsWith("Please provide") ||
    error.message.startsWith("Currency ")
  );
}

async function getTransactions(req, res) {
  try {
    const { month, type, category, page = "1", limit = "20" } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const filter = {
      userId: req.user.userId,
    };

    if (month) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return res.status(400).json({
          message: "Month must use YYYY-MM format",
        });
      }

      const { start, end } = getMonthRange(month);
      filter.date = { $gte: start, $lt: end };
    }

    if (type) {
      if (!["income", "expense"].includes(type)) {
        return res.status(400).json({
          message: "Type must be income or expense",
        });
      }

      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    return res.json({
      transactions: transactions.map((transaction) => ({
        ...transaction,
        category: normalizeCategory(transaction.category),
        currency: transaction.currency || "USD",
      })),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve transactions",
    });
  }
}

async function getAnalytics(req, res) {
  try {
    const { month } = req.query;

    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        message: "Month must use YYYY-MM format",
      });
    }

    const now = new Date();
    const selectedMonth =
      month ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [year, monthNumber] = selectedMonth.split("-").map(Number);

    const monthStart = new Date(Date.UTC(year, monthNumber - 1, 1));
    const monthEnd = new Date(Date.UTC(year, monthNumber, 1));

    const sixMonthStart = new Date(
      Date.UTC(year, monthNumber - 6, 1)
    );

    const userFilter = {
      userId: new mongoose.Types.ObjectId(req.user.userId),
    };

    const [monthlyTotals, categoryTotals, sixMonthTotals] =
      await Promise.all([
        Transaction.aggregate([
          {
            $match: {
              ...userFilter,
              date: { $gte: monthStart, $lt: monthEnd },
            },
          },
          {
            $group: {
              _id: {
                currency: { $ifNull: ["$currency", "USD"] },
                type: "$type",
              },
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]),

        Transaction.aggregate([
          {
            $match: {
              ...userFilter,
              date: { $gte: monthStart, $lt: monthEnd },
              type: "expense",
            },
          },
          {
            $group: {
              _id: {
                currency: { $ifNull: ["$currency", "USD"] },
                category: { $ifNull: ["$category", "Other"] },
              },
              total: { $sum: "$amount" },
            },
          },
        ]),

        Transaction.aggregate([
          {
            $match: {
              ...userFilter,
              date: { $gte: sixMonthStart, $lt: monthEnd },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$date" },
                month: { $month: "$date" },
                currency: { $ifNull: ["$currency", "USD"] },
                type: "$type",
              },
              total: { $sum: "$amount" },
            },
          },
        ]),
      ]);

    const summaryByCurrency = {};

    for (const item of monthlyTotals) {
      const currency = item._id.currency || "USD";

      if (!summaryByCurrency[currency]) {
        summaryByCurrency[currency] = {
          currency,
          income: 0,
          expenses: 0,
          cashFlow: 0,
          incomeCount: 0,
          expenseCount: 0,
        };
      }

      const summary = summaryByCurrency[currency];

      if (item._id.type === "income") {
        summary.income = item.total;
        summary.incomeCount = item.count;
      } else if (item._id.type === "expense") {
        summary.expenses = item.total;
        summary.expenseCount = item.count;
      }

      summary.cashFlow = summary.income - summary.expenses;
    }

    const spendingByCategory = categoryTotals.map((item) => ({
      category: normalizeCategory(item._id.category),
      amount: item.total,
      currency: item._id.currency || "USD",
    }));

    const monthlyByKey = new Map();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        Date.UTC(year, monthNumber - 1 - i, 1)
      );

      const key =
        `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

      monthlyByKey.set(key, {
        month: key,
        name: date.toLocaleString("en-US", {
          month: "short",
          timeZone: "UTC",
        }),
        currencies: {},
      });
    }

    for (const item of sixMonthTotals) {
      const key =
        `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;

      const monthData = monthlyByKey.get(key);

      if (!monthData) continue;

      const currency = item._id.currency || "USD";

      if (!monthData.currencies[currency]) {
        monthData.currencies[currency] = {
          income: 0,
          expenses: 0,
        };
      }

      if (item._id.type === "income") {
        monthData.currencies[currency].income = item.total;
      } else if (item._id.type === "expense") {
        monthData.currencies[currency].expenses = item.total;
      }
    }

    return res.json({
      month: selectedMonth,
      summaryByCurrency: Object.values(summaryByCurrency),
      spendingByCategory,
      monthlyData: Array.from(monthlyByKey.values()),
    });
  } catch (error) {
    console.error("Get analytics error:", error.message);

    return res.status(500).json({
      message: "Unable to calculate analytics",
    });
  }
}

async function createTransaction(req, res) {
  try {
    const input = getTransactionInput(req.body);

    const transaction = await Transaction.create({
      ...input,
      userId: req.user.userId,
      source: "manual",
    });

    return res.status(201).json({
      message: "Transaction created successfully",
      transaction: {
        ...transaction.toObject(),
        category: normalizeCategory(transaction.category),
      },
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Create transaction error:", error.message);

    return res.status(500).json({
      message: "Unable to create transaction",
    });
  }
}

async function updateTransaction(req, res) {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.userId,
      source: "manual",
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Manual transaction not found",
      });
    }

    const input = getTransactionInput(req.body);

    Object.assign(transaction, input);

    await transaction.save();

    return res.json({
      message: "Transaction updated successfully",
      transaction: {
        ...transaction.toObject(),
        category: normalizeCategory(transaction.category),
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid transaction ID",
      });
    }

    if (isValidationError(error)) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Update transaction error:", error.message);

    return res.status(500).json({
      message: "Unable to update transaction",
    });
  }
}

async function deleteTransaction(req, res) {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
      source: "manual",
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Manual transaction not found",
      });
    }

    return res.json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid transaction ID",
      });
    }

    console.error("Delete transaction error:", error.message);

    return res.status(500).json({
      message: "Unable to delete transaction",
    });
  }
}

module.exports = {
  getTransactions,
  getAnalytics,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
