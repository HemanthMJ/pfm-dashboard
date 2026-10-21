import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

import ConnectBank from "../components/ConnectBank";
import BankAccounts from "../components/BankAccounts";
import SyncTransactions from "../components/SyncTransactions";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import AnalyticsCharts from "../components/AnalyticsCharts";
import BudgetManager from "../components/BudgetManager";

import { getTransactions } from "../api/transactions";
import { getAnalytics } from "../api/analytics";

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

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [refreshKey, setRefreshKey] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState("");

  const refreshDashboard = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      setLoadingTransactions(true);
      setTransactionError("");

      const result = await getTransactions({
        page: 1,
        limit: 100,
      });

      setTransactions(result.transactions || []);
    } catch (err) {
      setTransactionError(
        err.response?.data?.message ||
          "Unable to load transactions."
      );
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      setAnalyticsError("");

      const result = await getAnalytics();
      setAnalytics(result);
    } catch (err) {
      setAnalyticsError(
        err.response?.data?.message ||
          "Unable to load financial analytics."
      );
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadAnalytics();
  }, [loadTransactions, loadAnalytics, refreshKey]);

  const summariesByCurrency = analytics?.summaryByCurrency || [];

  async function handleTransactionSaved() {
    setEditingTransaction(null);

    await Promise.all([
      loadTransactions(),
      loadAnalytics(),
    ]);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Personal Finance Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Welcome back, {user?.name || "User"}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-8">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Financial Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your income, expenses, budgets, and connected accounts.
            </p>
          </div>

          <ConnectBank onConnected={refreshDashboard} />
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Monthly Summary
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Totals include all recorded transactions and are separated by currency.
            </p>
          </div>

          {analyticsError && (
            <p className="text-sm text-red-600" role="alert">
              {analyticsError}
            </p>
          )}

          {summariesByCurrency.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              No transactions recorded for this month.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {summariesByCurrency.map((item) => (
                <article
                  key={item.currency}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:col-span-2 lg:col-span-3"
                >
                  <h3 className="font-semibold text-slate-900">
                    {item.currency} Summary
                  </h3>

                  <div className="mt-4 grid gap-5 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-slate-500">
                        Monthly Income
                      </p>

                      <p className="mt-2 text-2xl font-bold text-green-600">
                        {formatMoney(item.income, item.currency)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Monthly Expenses
                      </p>

                      <p className="mt-2 text-2xl font-bold text-red-600">
                        {formatMoney(item.expenses, item.currency)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Net Cash Flow
                      </p>

                      <p
                        className={`mt-2 text-2xl font-bold ${
                          item.cashFlow >= 0
                            ? "text-indigo-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatMoney(item.cashFlow, item.currency)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Connected Bank Accounts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your linked Sandbox accounts and balances.
            </p>
          </div>

          <BankAccounts refreshKey={refreshKey} />

          <SyncTransactions
            onSynced={async () => {
              refreshDashboard();

              await Promise.all([
                loadTransactions(),
                loadAnalytics(),
              ]);
            }}
          />
        </section>

        <AnalyticsCharts analytics={analytics} />

        <BudgetManager refreshKey={refreshKey} />

        <TransactionForm
          editingTransaction={editingTransaction}
          onSaved={handleTransactionSaved}
          onCancel={() => setEditingTransaction(null)}
        />

        {transactionError && (
          <p className="text-sm text-red-600" role="alert">
            {transactionError}
          </p>
        )}

        <TransactionList
          transactions={transactions}
          loading={loadingTransactions}
          onEdit={setEditingTransaction}
          onChanged={async () => {
            await Promise.all([
              loadTransactions(),
              loadAnalytics(),
            ]);
          }}
        />
      </div>
    </main>
  );
}
