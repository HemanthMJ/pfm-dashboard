import { useCallback, useEffect, useState } from "react";
import {
  deleteBudget,
  getBudgets,
  saveBudget,
} from "../api/budgets";

const categories = [
  "Food and Dining",
  "Shopping",
  "Transportation",
  "Housing",
  "Bills and Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Travel",
  "Other",
];

function getCurrentMonth() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatMoney(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount || 0);
  } catch {
    return `${amount || 0} ${currency}`;
  }
}

export default function BudgetManager({ refreshKey = 0 }) {
  const [month, setMonth] = useState(getCurrentMonth);
  const [category, setCategory] = useState("Food and Dining");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getBudgets(month);
      setBudgets(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load budgets."
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets, refreshKey]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await saveBudget({
        category,
        monthlyLimit: Number(monthlyLimit),
        month,
        currency,
      });

      setMonthlyLimit("");
      setMessage("Budget saved successfully.");

      await loadBudgets();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save budget."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this budget?")) return;

    try {
      setError("");
      setMessage("");

      await deleteBudget(id);
      setMessage("Budget deleted successfully.");

      await loadBudgets();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete budget."
      );
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Monthly Budgets
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Set limits and monitor spending by category.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Month
          </label>

          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Category
          </label>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Spending limit
          </label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={monthlyLimit}
            onChange={(event) => setMonthlyLimit(event.target.value)}
            required
            placeholder="500"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Currency
          </label>

          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
          >
            <option value="USD">USD ($)</option>
            <option value="INR">INR (₹)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Budget"}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-5" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="text-sm text-green-700 sm:col-span-2 lg:col-span-5" role="status">
            {message}
          </p>
        )}
      </form>

      {loading ? (
        <p className="text-slate-500">Loading budgets...</p>
      ) : budgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No budgets for this month. Create one above.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((budget) => {
            const percent = Math.min(
              100,
              Math.max(0, budget.percentageUsed || 0)
            );

            const exceeded = budget.exceeded;

            return (
              <article
                key={budget._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {budget.category}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatMoney(
                        budget.spent,
                        budget.currency
                      )}{" "}
                      spent of{" "}
                      {formatMoney(
                        budget.monthlyLimit,
                        budget.currency
                      )}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(budget._id)}
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      exceeded ? "bg-red-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="mt-3 flex justify-between gap-3 text-sm">
                  <span className={exceeded ? "font-semibold text-red-600" : "text-slate-500"}>
                    {budget.percentageUsed}% used
                  </span>

                  <span className={exceeded ? "font-semibold text-red-600" : "text-slate-600"}>
                    {exceeded ? "Over budget by " : "Remaining "}
                    {formatMoney(
                      Math.abs(budget.remaining),
                      budget.currency
                    )}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
