import { useCallback, useEffect, useState } from "react";
import { getAccounts } from "../api/plaid";

function formatCurrency(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount ?? 0);
  } catch {
    return `${amount ?? 0} ${currency || "USD"}`;
  }
}

export default function BankAccounts({ refreshKey = 0 }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load bank accounts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts, refreshKey]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading accounts...</p>;
  }

  return (
    <section className="space-y-4">
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!error && accounts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="font-medium text-slate-700">
            No bank accounts connected yet.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Use Connect Bank to add a Sandbox account.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.map((account) => (
          <article
            key={account._id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {account.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {account.institutionName}
                </p>
              </div>

              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium capitalize text-indigo-700">
                {account.subtype || account.type || "Account"}
              </span>
            </div>

            {account.mask && (
              <p className="mt-4 text-sm text-slate-500">
                Account ending in •••• {account.mask}
              </p>
            )}

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatCurrency(account.currentBalance, account.currency)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Current balance
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
