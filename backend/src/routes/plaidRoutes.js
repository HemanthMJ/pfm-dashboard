const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  syncTransactions,
} = require("../controllers/plaidController");

const router = express.Router();

router.use(authMiddleware);

router.post("/create-link-token", createLinkToken);
router.post("/exchange-token", exchangePublicToken);
router.get("/accounts", getAccounts);
router.post("/sync-transactions", syncTransactions);

module.exports = router;
