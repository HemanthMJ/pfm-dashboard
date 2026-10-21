import api from "./axios";

export const getBudgets = async (month) => {
  const response = await api.get("/budgets", {
    params: { month },
  });

  return response.data.budgets;
};

export const saveBudget = async (data) => {
  const response = await api.post("/budgets", data);
  return response.data;
};

export const deleteBudget = async (id) => {
  const response = await api.delete(`/budgets/${id}`);
  return response.data;
};
