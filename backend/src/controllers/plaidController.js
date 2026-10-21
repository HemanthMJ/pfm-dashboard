const plaidClient = require("../services/plaidService");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const PlaidItem = require("../models/PlaidItem");

const {
  encryptToken,
  decryptToken,
} = require("../utils/tokenEncryption");

async function createLinkToken(req, res) {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: req.user.userId,
      },
      client_name: "Personal Finance Dashboard",
      products: ["transactions"],
      country_codes: ["US"],
      language: "en",
    });

    return res.json({
      linkToken: response.data.link_token,
    });
  } catch (error) {
    console.error(
      "Plaid link token error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to initialize bank connection",
    });
  }
}

async function exchangePublicToken(req, res) {
  try {
    const { public_token, institution } = req.body;

    if (!public_token) {
      return res.status(400).json({
        message: "Public token is required",
      });
    }

    const exchangeResponse =
      await plaidClient.itemPublicTokenExchange({
        public_token,
      });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    const encryptedToken = encryptToken(accessToken);

    await PlaidItem.findOneAndUpdate(
      {
        userId: req.user.userId,
        itemId,
      },
      {
        $set: {
          ...encryptedToken,
          institutionId: institution?.institution_id || null,
          institutionName:
            institution?.name || "Connected Institution",
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return res.status(201).json({
      message: "Bank connected successfully",
    });
  } catch (error) {
    console.error(
      "Plaid token exchange error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to connect bank account",
    });
  }
}

async function getAccounts(req, res) {
  try {
    const items = await PlaidItem.find({
      userId: req.user.userId,
    });

    const results = [];

    for (const item of items) {
      const accessToken = decryptToken(
        item.accessTokenEncrypted,
        item.accessTokenIv,
        item.accessTokenAuthTag
      );

      const response = await plaidClient.accountsGet({
        access_token: accessToken,
      });

      for (const account of response.data.accounts) {
        const savedAccount = await Account.findOneAndUpdate(
          {
            userId: req.user.userId,
            plaidAccountId: account.account_id,
          },
          {
            $set: {
              name: account.name,
              officialName: account.official_name || null,
              type: account.type || "other",
              subtype: account.subtype || null,
              mask: account.mask || null,
              currentBalance: account.balances.current ?? 0,
              availableBalance: account.balances.available ?? null,
              currency: account.balances.iso_currency_code || null,
              institutionName: item.institutionName,
            },
            $setOnInsert: {
              userId: req.user.userId,
              plaidAccountId: account.account_id,
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );

        results.push(savedAccount);
      }
    }

    return res.json({
      accounts: results,
    });
  } catch (error) {
    console.error(
      "Get accounts error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to retrieve bank accounts",
    });
  }
}

function getTransactionCategory(transaction) {
  return (
    transaction.personal_finance_category?.primary ||
    transaction.category?.[0] ||
    "Other"
  );
}

async function syncTransactions(req, res) {
  try {
    const items = await PlaidItem.find({
      userId: req.user.userId,
    });

    if (items.length === 0) {
      return res.status(400).json({
        message: "Connect a bank account before syncing transactions",
      });
    }

    let totalAdded = 0;
    let totalModified = 0;
    let totalRemoved = 0;

    for (const item of items) {
      const accessToken = decryptToken(
        item.accessTokenEncrypted,
        item.accessTokenIv,
        item.accessTokenAuthTag
      );

      let cursor = item.cursor || undefined;
      let hasMore = true;

      while (hasMore) {
        const response = await plaidClient.transactionsSync({
          access_token: accessToken,
          ...(cursor ? { cursor } : {}),
          count: 100,
        });

        const data = response.data;

        for (const transaction of data.added) {
          const account = await Account.findOne({
            userId: req.user.userId,
            plaidAccountId: transaction.account_id,
          });

          // Plaid positive amounts generally represent money out.
          // Negative amounts generally represent money in.
          const amount = Math.abs(transaction.amount);
          const type =
            transaction.amount < 0 ? "income" : "expense";

          await Transaction.findOneAndUpdate(
            {
              userId: req.user.userId,
              plaidTransactionId: transaction.transaction_id,
            },
            {
              $set: {
                accountId: account?._id || null,
                merchant:
                  transaction.merchant_name ||
                  transaction.name ||
                  "Unknown Transaction",
                amount,
                type,
                category: getTransactionCategory(transaction),
                date: new Date(transaction.date),
                source: "plaid",
                currency:
                  transaction.iso_currency_code || null,
              },
            },
            {
              upsert: true,
              new: true,
              runValidators: true,
            }
          );

          totalAdded++;
        }

        for (const transaction of data.modified) {
          const account = await Account.findOne({
            userId: req.user.userId,
            plaidAccountId: transaction.account_id,
          });

          await Transaction.findOneAndUpdate(
            {
              userId: req.user.userId,
              plaidTransactionId: transaction.transaction_id,
            },
            {
              $set: {
                accountId: account?._id || null,
                merchant:
                  transaction.merchant_name ||
                  transaction.name ||
                  "Unknown Transaction",
                amount: Math.abs(transaction.amount),
                type:
                  transaction.amount < 0
                    ? "income"
                    : "expense",
                category: getTransactionCategory(transaction),
                date: new Date(transaction.date),
                source: "plaid",
                currency:
                  transaction.iso_currency_code || null,
              },
            },
            {
              new: true,
              runValidators: true,
            }
          );

          totalModified++;
        }

        for (const removed of data.removed) {
          await Transaction.deleteOne({
            userId: req.user.userId,
            plaidTransactionId: removed.transaction_id,
          });

          totalRemoved++;
        }

        cursor = data.next_cursor;
        hasMore = data.has_more;
      }

      item.cursor = cursor || item.cursor;
      await item.save();
    }

    return res.json({
      message: "Transactions synchronized successfully",
      added: totalAdded,
      modified: totalModified,
      removed: totalRemoved,
    });
  } catch (error) {
    console.error(
      "Transaction sync error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to synchronize transactions",
    });
  }
}

module.exports = {
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  syncTransactions,
};
