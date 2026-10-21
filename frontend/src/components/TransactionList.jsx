import { useState } from "react";
import { deleteTransaction } from "../api/transactions";

function formatAmount(amount, currency) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return `${amount} ${currency || "USD"}`;
  }
}

function formatDate(date) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString();
}

export default function TransactionList({
  transactions,
  loading,
  onEdit,
  onChanged,
}) {
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  async function handleDelete(transaction) {
    if (
      !window.confirm(
        `Delete the manual transaction "${transaction.merchant}"?`
      )
    ) {
      return;
    }

    try {
      setError("");
      setDeletingId(transaction._id);

      await deleteTransaction(transaction._id);
      await onChanged?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete the transaction."
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Recent Transactions
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Your latest recorded income and expenses.
        </p>
      </div>

      {error && (
        <p className="px-6 pt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="p-6 text-slate-500">Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <p className="p-6 text-slate-500">
          No transactions yet. Add your first transaction above.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Source</th>
                <th className="px-6 py-4 text-right font-medium">Amount</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {transaction.merchant}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {transaction.category}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(transaction.date)}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">
                      {transaction.source || "manual"}
                    </span>
                  </td>

                  <td
                    className={`px-6 py-4 text-right font-semibold ${
                      transaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "−"}
                    {formatAmount(
                      transaction.amount,
                      transaction.currency
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {transaction.source === "manual" ? (
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => onEdit(transaction)}
                          className="font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(transaction)}
                          disabled={deletingId === transaction._id}
                          className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {deletingId === transaction._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Bank imported
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
