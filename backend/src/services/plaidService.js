const {
  Configuration,
  PlaidApi,
  PlaidEnvironments
} = require("plaid");

const environment = process.env.PLAID_ENV || "sandbox";

if (!PlaidEnvironments[environment]) {
  throw new Error("Invalid PLAID_ENV configuration");
}

const configuration = new Configuration({
  basePath: PlaidEnvironments[environment],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET
    }
  }
});

const plaidClient = new PlaidApi(configuration);

module.exports = plaidClient;
