
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CustomerOrder = {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
};

type Customer = {
  customer_key: string;
  customer_name: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  total_orders: number;
  paid_orders: number;
  total_spent: number;
  first_purchase: string;
  last_purchase: string;
  orders: CustomerOrder[];
};

type Summary = {
  total_customers: number;
  repeat_customers: number;
  total_paid_revenue: number;
  average_customer_spend: number;
};

type Segment = "All" | "VIP" | "Loyal" | "New" | "Inactive";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function dateText(value: string) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysSince(value: string) {
  const date = new Date(value).getTime();

  if (!Number.isFinite(date)) return 0;

  return Math.max(
    0,
    Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24))
  );
}

function getSegment(customer: Customer): Exclude<Segment, "All"> {
  const inactiveDays = daysSince(customer.last_purchase);

  if (inactiveDays >= 60) return "Inactive";
  if (customer.paid_orders >= 5 && customer.total_spent > 0) return "VIP";
  if (customer.total_orders >= 2) return "Loyal";

  return "New";
}

function segmentStyle(segment: string) {
  switch (segment) {
    case "VIP":
      return "bg-purple-100 text-purple-700";
    case "Loyal":
      return "bg-blue-100 text-blue-700";
    case "Inactive":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-green-100 text-green-700";
  }
}

export default function StoreCustomerInsightsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_customers: 0,
    repeat_customers: 0,
    total_paid_revenue: 0,
    average_customer_spend: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<Segment>("All");
  const [sortBy, setSortBy] = useState("spending");

  const loadData = useCallback(async (adminPassword: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/store-customers", {
        method: "GET",
        cache: "no-store",
        headers: {
          "x-admin-password": adminPassword,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load customer insights.");
      }

      setCustomers(data.customers || []);
      setSummary(data.summary || {
        total_customers: 0,
        repeat_customers: 0,
        total_paid_revenue: 0,
        average_customer_spend: 0,
      });

      setAuthenticated(true);
    } catch (err) {
      setAuthenticated(false);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customer insights."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedPassword = sessionStorage.getItem("storeAdminPassword");

    if (savedPassword) {
      setPassword(savedPassword);
      loadData(savedPassword);
    } else {
      setLoading(false);
    }
  }, [loadData]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!password.trim()) {
      setError("Please enter your admin password.");
      return;
    }

    sessionStorage.setItem("storeAdminPassword", password);
    await loadData(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("storeAdminPassword");
    setAuthenticated(false);
    setPassword("");
    setCustomers([]);
    setError("");
  };

  const enrichedCustomers = useMemo(() => {
    return customers.map((customer) => ({
      ...customer,
      segment: getSegment(customer),
      inactive_days: daysSince(customer.last_purchase),
    }));
  }, [customers]);

  const vipCustomers = enrichedCustomers.filter(
    (customer) => customer.segment === "VIP"
  );

  const loyalCustomers = enrichedCustomers.filter(
    (customer) => customer.segment === "Loyal"
  );

  const newCustomers = enrichedCustomers.filter(
    (customer) => customer.segment === "New"
  );

  const inactiveCustomers = enrichedCustomers.filter(
    (customer) => customer.segment === "Inactive"
  );

  const filteredCustomers = useMemo(() => {
    let result = enrichedCustomers.filter((customer) => {
      const matchesSearch =
        customer.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        customer.mobile.toLowerCase().includes(search.toLowerCase()) ||
        customer.city.toLowerCase().includes(search.toLowerCase());

      const matchesSegment =
        segment === "All" || customer.segment === segment;

      return matchesSearch && matchesSegment;
    });

    if (sortBy === "spending") {
      result.sort((a, b) => b.total_spent - a.total_spent);
    } else if (sortBy === "orders") {
      result.sort((a, b) => b.total_orders - a.total_orders);
    } else if (sortBy === "recent") {
      result.sort(
        (a, b) =>
          new Date(b.last_purchase).getTime() -
          new Date(a.last_purchase).getTime()
      );
    } else if (sortBy === "inactive") {
      result.sort((a, b) => b.inactive_days - a.inactive_days);
    }

    return result;
  }, [enrichedCustomers, search, segment, sortBy]);

  const topCustomers = useMemo(
    () =>
      [...enrichedCustomers]
        .filter((customer) => customer.total_spent > 0)
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 5),
    [enrichedCustomers]
  );

  const exportCSV = () => {
    if (filteredCustomers.length === 0) {
      alert("No customers available to export.");
      return;
    }

    const headers = [
      "Customer Name",
      "Mobile",
      "City",
      "Total Orders",
      "Paid Orders",
      "Paid Spending",
      "Customer Segment",
      "Days Since Last Purchase",
      "First Purchase",
      "Last Purchase",
    ];

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = filteredCustomers.map((customer) => [
      customer.customer_name,
      customer.mobile,
      customer.city,
      customer.total_orders,
      customer.paid_orders,
      customer.total_spent,
      customer.segment,
      customer.inactive_days,
      customer.first_purchase,
      customer.last_purchase,
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "customer-loyalty-insights.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  if (!authenticated && !loading) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-12">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mb-3 text-5xl">🏆</div>
            <h1 className="text-2xl font-bold text-gray-900">
              Customer Loyalty & Insights
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Store Admin Login
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter admin password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Login
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="font-semibold text-gray-600">
          Loading customer insights...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Customer Loyalty & Insights
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              A4 Paper & Printer Ink Store
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadData(password)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              ↻ Refresh
            </button>

            <button
              onClick={exportCSV}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              ↓ Export Report
            </button>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Main Metrics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="mt-3 text-3xl font-bold text-gray-900">
              {summary.total_customers}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">VIP Customers</p>
            <p className="mt-3 text-3xl font-bold text-purple-600">
              {vipCustomers.length}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              At least 5 paid orders
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Loyal Customers</p>
            <p className="mt-3 text-3xl font-bold text-blue-600">
              {loyalCustomers.length}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Multiple orders, not VIP or inactive
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Inactive Customers</p>
            <p className="mt-3 text-3xl font-bold text-orange-600">
              {inactiveCustomers.length}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              No order in the last 60 days
            </p>
          </div>
        </div>

        {/* Segment Overview */}
        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              Customer Segments
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Customers are grouped automatically using their order history.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <button
              onClick={() => setSegment("VIP")}
              className="rounded-xl border border-purple-100 bg-purple-50 p-4 text-left hover:border-purple-300"
            >
              <p className="text-sm font-semibold text-purple-700">
                👑 VIP Customers
              </p>
              <p className="mt-2 text-2xl font-bold text-purple-900">
                {vipCustomers.length}
              </p>
              <p className="mt-1 text-xs text-purple-600">
                5 or more paid orders
              </p>
            </button>

            <button
              onClick={() => setSegment("Loyal")}
              className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-left hover:border-blue-300"
            >
              <p className="text-sm font-semibold text-blue-700">
                💙 Loyal Customers
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-900">
                {loyalCustomers.length}
              </p>
              <p className="mt-1 text-xs text-blue-600">
                2 or more orders
              </p>
            </button>

            <button
              onClick={() => setSegment("New")}
              className="rounded-xl border border-green-100 bg-green-50 p-4 text-left hover:border-green-300"
            >
              <p className="text-sm font-semibold text-green-700">
                ✨ New Customers
              </p>
              <p className="mt-2 text-2xl font-bold text-green-900">
                {newCustomers.length}
              </p>
              <p className="mt-1 text-xs text-green-600">
                One order, active within 60 days
              </p>
            </button>

            <button
              onClick={() => setSegment("Inactive")}
              className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-left hover:border-orange-300"
            >
              <p className="text-sm font-semibold text-orange-700">
                🕒 Inactive Customers
              </p>
              <p className="mt-2 text-2xl font-bold text-orange-900">
                {inactiveCustomers.length}
              </p>
              <p className="mt-1 text-xs text-orange-600">
                No order in 60+ days
              </p>
            </button>
          </div>
        </section>

        {/* Revenue Insights */}
        <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Paid Revenue
            </p>
            <p className="mt-3 text-3xl font-bold text-green-600">
              {money(summary.total_paid_revenue)}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Revenue from orders marked as paid
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Average Customer Spend
            </p>
            <p className="mt-3 text-3xl font-bold text-blue-600">
              {money(summary.average_customer_spend)}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Total paid revenue divided by customer count
            </p>
          </div>
        </section>

        {/* Top Customers */}
        <section className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-bold text-gray-900">
              🏆 Top Customers
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Ranked by total paid spending
            </p>
          </div>

          {topCustomers.length === 0 ? (
            <p className="p-6 text-center text-gray-500">
              No paid customer purchases yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Rank</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Mobile</th>
                    <th className="px-5 py-3">Orders</th>
                    <th className="px-5 py-3">Paid Spending</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {topCustomers.map((customer, index) => (
                    <tr key={customer.customer_key}>
                      <td className="px-5 py-4 font-bold text-gray-700">
                        #{index + 1}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {customer.customer_name}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {customer.mobile || "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {customer.total_orders}
                      </td>
                      <td className="px-5 py-4 font-bold text-green-600">
                        {money(customer.total_spent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Customer Search and Full Insights */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-900">
              Customer Insights
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, mobile or city..."
                className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />

              <select
                value={segment}
                onChange={(event) =>
                  setSegment(event.target.value as Segment)
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="All">All Segments</option>
                <option value="VIP">VIP Customers</option>
                <option value="Loyal">Loyal Customers</option>
                <option value="New">New Customers</option>
                <option value="Inactive">Inactive Customers</option>
              </select>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="spending">Highest Spending</option>
                <option value="orders">Most Orders</option>
                <option value="recent">Latest Purchase</option>
                <option value="inactive">Longest Inactive</option>
              </select>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              Showing {filteredCustomers.length} of {customers.length} customers
            </p>
          </div>

          {filteredCustomers.length === 0 ? (
            <p className="p-8 text-center text-gray-500">
              No matching customers found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Mobile</th>
                    <th className="px-5 py-3">Segment</th>
                    <th className="px-5 py-3">Orders</th>
                    <th className="px-5 py-3">Paid Spending</th>
                    <th className="px-5 py-3">Last Purchase</th>
                    <th className="px-5 py-3">Activity</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.customer_key}>
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {customer.customer_name}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {customer.mobile || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${segmentStyle(customer.segment)}`}
                        >
                          {customer.segment}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {customer.total_orders}
                      </td>

                      <td className="px-5 py-4 font-semibold text-green-600">
                        {money(customer.total_spent)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {dateText(customer.last_purchase)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {customer.inactive_days} days ago
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-gray-400">
          Customer Loyalty & Insights · A4 Paper & Printer Ink Store
        </p>
      </div>
    </main>
  );
}
