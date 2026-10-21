import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

function formatMoney(value, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  } catch {
    return `${currency} ${(Number(value) || 0).toFixed(2)}`;
  }
}

function formatCompact(value, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(Number(value) || 0);
  } catch {
    return `${currency} ${value}`;
  }
}

const CATEGORY_MAP = {
  FOOD_AND_DRINK: "Food and Dining",
  GENERAL_MERCHANDISE: "Shopping",
  TRANSPORTATION: "Transportation",
  RENT_AND_UTILITIES: "Housing",
  HOME_IMPROVEMENT: "Housing",
  MEDICAL: "Healthcare",
  EDUCATION: "Education",
  TRAVEL: "Travel",
  ENTERTAINMENT: "Entertainment",
  PERSONAL_CARE: "Other",
  GOVERNMENT_AND_NON_PROFIT: "Other",
  BANK_FEES: "Bills and Utilities",
  LOAN_PAYMENTS: "Bills and Utilities",
  INCOME: "Salary",
  TRANSFER_IN: "Other",
  TRANSFER_OUT: "Other",
  OTHER: "Other",
};

function normalizeCategory(category) {
  if (!category) return "Other";

  if (
    [
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
    ].includes(category)
  ) {
    return category;
  }

  const normalized = category
    .trim()
    .toUpperCase()
    .replace(/[\s&-]+/g, "_");

  if (CATEGORY_MAP[normalized]) {
    return CATEGORY_MAP[normalized];
  }

  const lower = category.toLowerCase();

  if (lower.includes("food") || lower.includes("drink")) {
    return "Food and Dining";
  }

  if (lower.includes("shop") || lower.includes("merchandise")) {
    return "Shopping";
  }

  if (lower.includes("transport") || lower.includes("vehicle")) {
    return "Transportation";
  }

  if (lower.includes("rent") || lower.includes("mortgage")) {
    return "Housing";
  }

  if (lower.includes("utilit") || lower.includes("bill")) {
    return "Bills and Utilities";
  }

  if (lower.includes("medical") || lower.includes("health")) {
    return "Healthcare";
  }

  if (lower.includes("education")) {
    return "Education";
  }

  if (lower.includes("travel")) {
    return "Travel";
  }

  if (lower.includes("entertainment")) {
    return "Entertainment";
  }

  if (lower.includes("salary") || lower.includes("wage")) {
    return "Salary";
  }

  if (lower.includes("freelance")) {
    return "Freelance";
  }

  if (lower.includes("investment")) {
    return "Investment";
  }

  return "Other";
}

function getCurrencyList(analytics) {
  const currencies = new Set();

  analytics?.summaryByCurrency?.forEach((item) => {
    currencies.add(item.currency || "USD");
  });

  analytics?.spendingByCategory?.forEach((item) => {
    currencies.add(item.currency || "USD");
  });

  analytics?.monthlyData?.forEach((month) => {
    Object.keys(month.currencies || {}).forEach((currency) => {
      currencies.add(currency);
    });
  });

  return Array.from(currencies).sort();
}

function getCategoryData(analytics, currency) {
  const totals = new Map();

  (analytics?.spendingByCategory || [])
    .filter((item) => (item.currency || "USD") === currency)
    .forEach((item) => {
      const category = normalizeCategory(item.category);
      const amount = Number(item.amount) || 0;

      totals.set(
        category,
        (totals.get(category) || 0) + amount
      );
    });

  return Array.from(totals, ([name, value]) => ({
    name,
    value,
  })).filter((item) => item.value > 0);
}

function getMonthlyData(analytics, currency) {
  return (analytics?.monthlyData || []).map((month) => {
    const currencyData = month.currencies?.[currency] || {};

    return {
      month: month.month,
      name: month.name,
      income: Number(currencyData.income) || 0,
      expenses: Number(currencyData.expenses) || 0,
    };
  });
}

export default function AnalyticsCharts({ analytics }) {
  const currencies = getCurrencyList(analytics);

  if (!analytics) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Financial Analytics
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Loading your financial analytics...
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Financial Analytics
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Complete transaction analytics for the last six calendar months,
          separated by currency.
        </p>
      </div>

      {currencies.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          No financial data is available for the selected period.
          Add a transaction to get started.
        </div>
      ) : (
        currencies.map((currency) => {
          const spendingByCategory = getCategoryData(
            analytics,
            currency
          );

          const monthlyData = getMonthlyData(
            analytics,
            currency
          );

          return (
            <div key={currency} className="space-y-5">
              <h3 className="text-lg font-bold text-slate-800">
                {currency} Analytics
              </h3>

              <div className="grid gap-6 lg:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="font-bold text-slate-900">
                    Spending by Category
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Current month · {currency}
                  </p>

                  {spendingByCategory.length === 0 ? (
                    <div className="flex h-72 items-center justify-center text-center text-sm text-slate-500">
                      No expenses recorded in {currency} this month.
                    </div>
                  ) : (
                    <>
                      <div className="mt-4 h-72">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >
                          <PieChart>
                            <Pie
                              data={spendingByCategory}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                              label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {spendingByCategory.map(
                                (entry, index) => (
                                  <Cell
                                    key={entry.name}
                                    fill={
                                      COLORS[index % COLORS.length]
                                    }
                                  />
                                )
                              )}
                            </Pie>

                            <Tooltip
                              formatter={(value) =>
                                formatMoney(value, currency)
                              }
                            />

                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-2 border-t border-slate-100 pt-4">
                        <p className="text-sm text-slate-500">
                          Total expenses
                        </p>

                        <p className="mt-1 text-xl font-bold text-red-600">
                          {formatMoney(
                            spendingByCategory.reduce(
                              (total, item) => total + item.value,
                              0
                            ),
                            currency
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="font-bold text-slate-900">
                    Monthly Income vs Expenses
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Last six calendar months · {currency}
                  </p>

                  <div className="mt-4 h-72">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis dataKey="name" />

                        <YAxis
                          tickFormatter={(value) =>
                            formatCompact(value, currency)
                          }
                        />

                        <Tooltip
                          formatter={(value) =>
                            formatMoney(value, currency)
                          }
                        />

                        <Legend />

                        <Bar
                          dataKey="income"
                          name="Income"
                          fill="#10b981"
                          radius={[5, 5, 0, 0]}
                        />

                        <Bar
                          dataKey="expenses"
                          name="Expenses"
                          fill="#ef4444"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
