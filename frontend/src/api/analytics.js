import api from "./axios";

export async function getAnalytics(month) {
  const response = await api.get("/transactions/analytics", {
    params: month ? { month } : {},
  });

  return response.data;
}
