import { useEffect, useState } from "react";
import {
  createTransaction,
  updateTransaction,
} from "../api/transactions";

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
  "Salary",
  "Freelance",
  "Investment",
  "Other",
];

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getFormDate(date) {
  if (!date) return getToday();

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return getToday();

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function TransactionForm({
  editingTransaction,
  onSaved,
  onCancel,
}) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food and Dining");
  const [date, setDate] = useState(getToday());
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (editingTransaction) {
      setMerchant(editingTransaction.merchant);
      setAmount(String(editingTransaction.amount));
      setType(editingTransaction.type);
      setCategory(
        categories.includes(editingTransaction.category)
          ? editingTransaction.category
          : "Other"
      );
      setDate(getFormDate(editingTransaction.date));
      setCurrency(editingTransaction.currency || "USD");
    } else {
      setMerchant("");
      setAmount("");
      setType("expense");
      setCategory("Food and Dining");
      setDate(getToday());
      setCurrency("USD");
    }

    setError("");
    setSuccess("");
  }, [editingTransaction]);

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      merchant: merchant.trim(),
      amount: Number(amount),
      type,
      category,
      date,
      currency,
    };

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction._id, payload);
        setSuccess("Transaction updated successfully.");
      } else {
        await createTransaction(payload);
        setSuccess("Transaction added successfully.");
      }

      if (!editingTransaction) {
        setMerchant("");
        setAmount("");
        setType("expense");
        setCategory("Food and Dining");
        setDate(getToday());
      }

      await onSaved?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save the transaction."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-bold text-slate-900">
        {editingTransaction ? "Edit Transaction" : "Add Transaction"}
      </h2>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Merchant or description
          </label>

          <input
            value={merchant}
            onChange={(event) => setMerchant(event.target.value)}
            required
            maxLength={150}
            placeholder="e.g. Grocery Store"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Amount
          </label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Transaction type
          </label>

          <select
            value={type}
            onChange={(event) => {
              const nextType = event.target.value;
              setType(nextType);

              if (nextType === "income") {
                setCategory("Salary");
              } else if (
                category === "Salary" ||
                category === "Freelance" ||
                category === "Investment"
              ) {
                setCategory("Other");
              }
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
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
            {categories
              .filter((item) =>
                type === "income"
                  ? ["Salary", "Freelance", "Investment", "Other"].includes(item)
                  : !["Salary", "Freelance", "Investment"].includes(item)
              )
              .map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Date
          </label>

          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
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

        {error && (
          <p className="text-sm text-red-600 sm:col-span-2" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-green-700 sm:col-span-2" role="status">
            {success}
          </p>
        )}

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : editingTransaction
                ? "Update Transaction"
                : "Add Transaction"}
          </button>

          {editingTransaction && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
