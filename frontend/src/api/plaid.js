import api from "./axios";

export const createLinkToken = async () => {
  const response = await api.post("/plaid/create-link-token");
  return response.data.linkToken;
};

export const exchangePublicToken = async (publicToken, metadata) => {
  const response = await api.post("/plaid/exchange-token", {
    public_token: publicToken,
    institution: metadata?.institution
      ? {
          institution_id: metadata.institution.id,
          name: metadata.institution.name,
        }
      : undefined,
  });

  return response.data;
};

export const getAccounts = async () => {
  const response = await api.get("/plaid/accounts");
  return response.data.accounts;
};

export const syncTransactions = async () => {
  const response = await api.post("/plaid/sync-transactions");
  return response.data;
};
