"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type StoreOrder = {
  id: string;
  customer_name: string | null;
  mobile: string | null;
  total_amount: number | string | null;
  status: string | null;
  payment_status: string | null;
  created_at: string;
};

type StoreOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number | string;
  price: number | string;
  total: number | string;
  category: string;
};

type ReportResponse = {
  success: boolean;
  error?: string;
  orders?: StoreOrder[];
  items?: StoreOrderItem[];
};

type RangeFilter = "all" | "today" | "7" | "30" | "90";

const PASSWORD_KEY = "storeAdminPassword";

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function isPaid(order: StoreOrder) {
  return String(order.payment_status || "").toLowerCase() === "paid";
}

function isCancelled(order: StoreOrder) {
  return String(order.status || "").toLowerCase() === "cancelled";
}

function getStartDate(range: RangeFilter) {
  if (range === "all") return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (range === "today") return start;

  start.setDate(start.getDate() - (Number(range) - 1));
  return start;
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function StoreSalesDashboardPage() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [items, setItems] = useState<StoreOrderItem[]>([]);
  const [range, setRange] = useState<RangeFilter>("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const loadReport = useCallback(async (adminPassword: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/store-orders", {
        method: "GET",
        headers: {
          "x-admin-password": adminPassword,
        },
        cache: "no-store",
      });

      const data: ReportResponse = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          sessionStorage.removeItem(PASSWORD_KEY);
          setIsLoggedIn(false);
        }
        throw new Error(data.error || "Unable to load the sales report.");
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setItems(Array.isArray(data.items) ? data.items : []);
      setLastUpdated(new Date().toLocaleString("en-IN"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the sales report."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedPassword = sessionStorage.getItem(PASSWORD_KEY);
    if (savedPassword) {
      setPassword(savedPassword);
      setIsLoggedIn(true);
      void loadReport(savedPassword);
    }
  }, [loadReport]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanPassword = password.trim();

    if (!cleanPassword) {
      setError("Please enter your Store Admin password.");
      return;
    }

    sessionStorage.setItem(PASSWORD_KEY, cleanPassword);
    setIsLoggedIn(true);
    await loadReport(cleanPassword);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(PASSWORD_KEY);
    setPassword("");
    setIsLoggedIn(false);
    setOrders([]);
    setItems([]);
    setError("");
  };

  const filteredOrders = useMemo(() => {
    const startDate = getStartDate(range);
    return orders.filter((order) => {
      if (!startDate) return true;
      const created = new Date(order.created_at);
      return !Number.isNaN(created.getTime()) && created >= startDate;
    });
  }, [orders, range]);

  const filteredOrderIds = useMemo(
    () => new Set(filteredOrders.map((order) => order.id)),
    [filteredOrders]
  );

  const filteredItems = useMemo(
    () => items.filter((item) => filteredOrderIds.has(item.order_id)),
    [items, filteredOrderIds]
  );

  const paidOrders = useMemo(
    () => filteredOrders.filter(isPaid),
    [filteredOrders]
  );

  const completedOrders = useMemo(
    () =>
      filteredOrders.filter(
        (order) =>
          String(order.status || "").toLowerCase() === "completed"
      ),
    [filteredOrders]
  );

  const pendingOrders = useMemo(
    () =>
      filteredOrders.filter(
        (order) =>
          String(order.status || "").toLowerCase() === "pending"
      ),
    [filteredOrders]
  );

  const cancelledOrders = useMemo(
    () => filteredOrders.filter(isCancelled),
    [filteredOrders]
  );

  const totalRevenue = useMemo(
    () =>
      paidOrders.reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0
      ),
    [paidOrders]
  );

  const averageOrderValue =
    paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  const categorySales = useMemo(() => {
    const paidIds = new Set(paidOrders.map((order) => order.id));
    const totals: Record<string, number> = {
      "A4 Paper": 0,
      "Printer Ink": 0,
      Other: 0,
    };

    for (const item of filteredItems) {
      if (!paidIds.has(item.order_id)) continue;
      const category = totals[item.category] !== undefined
        ? item.category
        : "Other";
      totals[category] += Number(item.total || 0);
    }

    return totals;
  }, [filteredItems, paidOrders]);

  const bestSellers = useMemo(() => {
    const paidIds = new Set(paidOrders.map((order) => order.id));
    const products = new Map<
      string,
      { name: string; category: string; quantity: number; revenue: number }
    >();

    for (const item of filteredItems) {
      if (!paidIds.has(item.order_id)) continue;

      const key = item.product_id || item.product_name;
      const current = products.get(key) || {
        name: item.product_name,
        category: item.category || "Other",
        quantity: 0,
        revenue: 0,
      };

      current.quantity += Number(item.quantity || 0);
      current.revenue += Number(item.total || 0);
      products.set(key, current);
    }

    return Array.from(products.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);
  }, [filteredItems, paidOrders]);

  const dailySales = useMemo(() => {
    const paidIds = new Set(paidOrders.map((order) => order.id));
    const totals = new Map<string, number>();

    for (const order of paidOrders) {
      const date = new Date(order.created_at);
      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      totals.set(
        key,
        (totals.get(key) || 0) + Number(order.total_amount || 0)
      );
    }

    return Array.from(totals.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7);
  }, [paidOrders]);

  const maxDailySales = Math.max(
    1,
    ...dailySales.map(([, value]) => value)
  );

  const exportReport = () => {
    const rows: unknown[][] = [
      [
        "Order ID",
        "Customer",
        "Mobile",
        "Order Date",
        "Order Status",
        "Payment Status",
        "Order Amount",
      ],
      ...filteredOrders.map((order) => [
        order.id,
        order.customer_name,
        order.mobile,
        new Date(order.created_at).toLocaleString("en-IN"),
        order.status,
        order.payment_status,
        Number(order.total_amount || 0).toFixed(2),
      ]),
    ];

    downloadCsv("store-sales-report.csv", rows);
  };

  const exportBestSellers = () => {
    const rows: unknown[][] = [
      ["Product", "Category", "Quantity Sold", "Paid Revenue"],
      ...bestSellers.map((product) => [
        product.name,
        product.category,
        product.quantity,
        product.revenue.toFixed(2),
      ]),
    ];

    downloadCsv("store-best-selling-products.csv", rows);
  };

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 text-center">
            <div className="text-4xl">📊</div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              Store Sales Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Sign in with your existing Store Admin password.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Store Admin Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500"
                placeholder="Enter admin password"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Open Dashboard"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              A4 PAPER & PRINTER INK STORE
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Sales & Revenue Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Revenue is calculated from orders marked as Paid.
            </p>
            {lastUpdated && (
              <p className="mt-1 text-xs text-slate-400">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void loadReport(password)}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
            <button
              onClick={exportReport}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Export Orders CSV
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-semibold text-slate-600">
            Report period:
          </span>
          {([
            ["today", "Today"],
            ["7", "Last 7 days"],
            ["30", "Last 30 days"],
            ["90", "Last 90 days"],
            ["all", "All time"],
          ] as [RangeFilter, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                range === value
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Paid Revenue"
            value={money(totalRevenue)}
            detail={`${paidOrders.length} paid orders`}
            icon="₹"
          />
          <StatCard
            title="Total Orders"
            value={String(filteredOrders.length)}
            detail="All payment and order statuses"
            icon="🧾"
          />
          <StatCard
            title="Completed Orders"
            value={String(completedOrders.length)}
            detail="Orders with Completed status"
            icon="✓"
          />
          <StatCard
            title="Average Paid Order"
            value={money(averageOrderValue)}
            detail="Average value of paid orders"
            icon="📈"
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <SmallStat title="Pending Orders" value={pendingOrders.length} />
          <SmallStat title="Cancelled Orders" value={cancelledOrders.length} />
          <SmallStat
            title="Unpaid / Failed Orders"
            value={filteredOrders.filter((order) => !isPaid(order)).length}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Sales by Category
                </h2>
                <p className="text-sm text-slate-500">
                  Paid order item revenue
                </p>
              </div>
            </div>

            {(["A4 Paper", "Printer Ink", "Other"] as const).map((category) => {
              const amount = categorySales[category];
              const maximum = Math.max(
                1,
                ...Object.values(categorySales)
              );
              const percentage = (amount / maximum) * 100;

              return (
                <div key={category} className="mb-5 last:mb-0">
                  <div className="mb-2 flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-700">
                      {category}
                    </span>
                    <span className="font-bold text-slate-900">
                      {money(amount)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Recent Daily Sales
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              Paid revenue for the latest seven dates with sales
            </p>

            {dailySales.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
                No paid sales found for this period.
              </p>
            ) : (
              <div className="space-y-3">
                {dailySales.map(([date, amount]) => (
                  <div key={date} className="grid grid-cols-[90px_1fr_auto] items-center gap-3">
                    <span className="text-xs text-slate-500">
                      {new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${(amount / maxDailySales) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {money(amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Best-Selling Products
              </h2>
              <p className="text-sm text-slate-500">
                Ranked by quantity in paid orders
              </p>
            </div>
            <button
              onClick={exportBestSellers}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Export Products CSV
            </button>
          </div>

          {bestSellers.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
              No paid product sales found for this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3 text-right">Quantity Sold</th>
                    <th className="px-3 py-3 text-right">Paid Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers.map((product, index) => (
                    <tr
                      key={`${product.name}-${index}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {product.name}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {product.category}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-800">
                        {product.quantity}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-800">
                        {money(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Orders in This Period
              </h2>
              <p className="text-sm text-slate-500">
                {filteredOrders.length} order(s)
              </p>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
              No orders found for this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="px-3 py-3">Order</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Order Status</th>
                    <th className="px-3 py-3">Payment</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-3 font-mono text-xs text-slate-600">
                        {order.id.slice(0, 8)}…
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-800">
                          {order.customer_name || "Customer"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {order.mobile || ""}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {new Date(order.created_at).toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill value={order.status || "Unknown"} />
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill value={order.payment_status || "Unknown"} />
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-800">
                        {money(Number(order.total_amount || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="pb-4 text-center text-xs text-slate-400">
          A4 Paper & Printer Ink Store · Sales figures are based on saved order records.
        </p>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-700">
          {icon}
        </span>
      </div>
      <p className="mt-3 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function SmallStat({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  let classes = "bg-slate-100 text-slate-700";

  if (normalized === "paid" || normalized === "completed") {
    classes = "bg-emerald-100 text-emerald-800";
  } else if (
    normalized === "pending" ||
    normalized === "processing"
  ) {
    classes = "bg-amber-100 text-amber-800";
  } else if (
    normalized === "failed" ||
    normalized === "cancelled" ||
    normalized === "rejected"
  ) {
    classes = "bg-red-100 text-red-800";
  } else if (
    normalized === "shipped" ||
    normalized === "packed"
  ) {
    classes = "bg-blue-100 text-blue-800";
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {value}
    </span>
  );
}
