
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
  landmark: string;
  city: string;
  state: string;
  pin_code: string;
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

function formatDate(date: string) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function statusColor(status: string) {
  const value = status.toLowerCase();

  if (value === "paid" || value === "completed") {
    return "bg-green-100 text-green-700";
  }

  if (value === "pending" || value === "processing") {
    return "bg-yellow-100 text-yellow-800";
  }

  if (
    value === "failed" ||
    value === "cancelled" ||
    value === "rejected"
  ) {
    return "bg-red-100 text-red-700";
  }

  return "bg-gray-100 text-gray-700";
}

export default function StoreCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_customers: 0,
    repeat_customers: 0,
    total_paid_revenue: 0,
    average_customer_spend: 0,
  });

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loadCustomers = useCallback(async (adminPassword: string) => {
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
        throw new Error(data.error || "Unable to load customers.");
      }

      const customerData: Customer[] = data.customers || [];

      setCustomers(customerData);
      setSummary(data.summary || {
        total_customers: 0,
        repeat_customers: 0,
        total_paid_revenue: 0,
        average_customer_spend: 0,
      });

      setSelectedCustomer((previous) => {
        if (!previous) return customerData[0] || null;

        return (
          customerData.find(
            (customer) =>
              customer.customer_key === previous.customer_key
          ) || customerData[0] || null
        );
      });

      setAuthenticated(true);
    } catch (err) {
      setAuthenticated(false);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedPassword = sessionStorage.getItem("storeAdminPassword");

    if (savedPassword) {
      setPassword(savedPassword);
      loadCustomers(savedPassword);
    } else {
      setLoading(false);
    }
  }, [loadCustomers]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!password.trim()) {
      setError("Please enter your admin password.");
      return;
    }

    sessionStorage.setItem("storeAdminPassword", password);
    await loadCustomers(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("storeAdminPassword");
    setAuthenticated(false);
    setPassword("");
    setCustomers([]);
    setSelectedCustomer(null);
    setError("");
  };

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    const search = searchTerm.toLowerCase().trim();

    if (search) {
      result = result.filter((customer) =>
        customer.customer_name.toLowerCase().includes(search) ||
        customer.mobile.toLowerCase().includes(search) ||
        customer.city.toLowerCase().includes(search)
      );
    }

    if (filter === "repeat") {
      result = result.filter(
        (customer) => customer.total_orders > 1
      );
    } else if (filter === "single") {
      result = result.filter(
        (customer) => customer.total_orders === 1
      );
    } else if (filter === "paid") {
      result = result.filter(
        (customer) => customer.paid_orders > 0
      );
    }

    return result;
  }, [customers, searchTerm, filter]);

  const exportCustomersCSV = () => {
    if (filteredCustomers.length === 0) {
      alert("No customers available to export.");
      return;
    }

    const headers = [
      "Customer Name",
      "Mobile",
      "Address",
      "City",
      "State",
      "PIN Code",
      "Total Orders",
      "Paid Orders",
      "Total Paid Spending",
      "First Purchase",
      "Latest Purchase",
    ];

    const rows = filteredCustomers.map((customer) => [
      customer.customer_name,
      customer.mobile,
      customer.address,
      customer.city,
      customer.state,
      customer.pin_code,
      customer.total_orders,
      customer.paid_orders,
      customer.total_spent,
      customer.first_purchase,
      customer.last_purchase,
    ]);

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

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
    link.download = "store-customers.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const exportCustomerOrdersCSV = () => {
    if (!selectedCustomer) return;

    const headers = [
      "Order ID",
      "Order Date",
      "Amount",
      "Order Status",
      "Payment Status",
    ];

    const rows = selectedCustomer.orders.map((order) => [
      order.id,
      order.created_at,
      order.total_amount,
      order.status,
      order.payment_status,
    ]);

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

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
    link.download = "customer-order-history.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  if (!authenticated && !loading) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-12">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-5 text-center">
            <div className="mb-3 text-5xl">👥</div>
            <h1 className="text-2xl font-bold text-gray-900">
              Customer Management
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Store Admin Login
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Admin Password
              </label>

              <div className="flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter admin password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="rounded-lg border px-3 text-sm"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Login"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg font-semibold text-gray-600">
          Loading customer dashboard...
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
              Customer Management
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              A4 Paper & Printer Ink Store
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadCustomers(password)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              ↻ Refresh
            </button>

            <button
              onClick={exportCustomersCSV}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              ↓ Export Customers
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

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Customers
            </p>
            <p className="mt-3 text-3xl font-bold text-gray-900">
              {summary.total_customers}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Unique mobile numbers
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Repeat Customers
            </p>
            <p className="mt-3 text-3xl font-bold text-blue-600">
              {summary.repeat_customers}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Customers with multiple orders
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Paid Revenue
            </p>
            <p className="mt-3 text-2xl font-bold text-green-600">
              {formatCurrency(summary.total_paid_revenue)}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              From paid store orders
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Average Customer Spend
            </p>
            <p className="mt-3 text-2xl font-bold text-purple-600">
              {formatCurrency(summary.average_customer_spend)}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Paid revenue divided by all customers
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Search Customers
              </label>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search by name, mobile number or city..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="w-full lg:w-64">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Customer Filter
              </label>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="all">All Customers</option>
                <option value="repeat">Repeat Customers</option>
                <option value="single">Single Order Customers</option>
                <option value="paid">Customers With Paid Orders</option>
              </select>
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>

        {/* Customer List and Profile */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-5">

          {/* Customer List */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-2">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-bold text-gray-900">
                Customer List
              </h2>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No customers found.
              </div>
            ) : (
              <div className="max-h-[750px] divide-y divide-gray-100 overflow-y-auto">
                {filteredCustomers.map((customer) => {
                  const isSelected =
                    selectedCustomer?.customer_key ===
                    customer.customer_key;

                  return (
                    <button
                      key={customer.customer_key}
                      onClick={() => setSelectedCustomer(customer)}
                      className={`w-full p-4 text-left transition hover:bg-blue-50 ${
                        isSelected ? "bg-blue-50" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {customer.customer_name}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {customer.mobile || "No mobile"}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {customer.city || "City not available"}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(customer.total_spent)}
                          </p>

                          <span
                            className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                              customer.total_orders > 1
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {customer.total_orders > 1
                              ? "Repeat"
                              : "Single"}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-gray-400">
                        {customer.total_orders} order(s) · Last order:{" "}
                        {formatDate(customer.last_purchase)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Customer Profile */}
          <section className="min-w-0 space-y-6 xl:col-span-3">
            {!selectedCustomer ? (
              <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
                Select a customer to view their profile.
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Customer Profile
                      </p>

                      <h2 className="mt-2 text-2xl font-bold text-gray-900">
                        {selectedCustomer.customer_name}
                      </h2>

                      <p className="mt-1 text-gray-600">
                        {selectedCustomer.mobile || "No mobile number"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-2 text-sm font-semibold ${
                        selectedCustomer.total_orders > 1
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {selectedCustomer.total_orders > 1
                        ? "Repeat Customer"
                        : "Single Order Customer"}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">
                        Total Orders
                      </p>
                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {selectedCustomer.total_orders}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">
                        Paid Orders
                      </p>
                      <p className="mt-1 text-xl font-bold text-green-600">
                        {selectedCustomer.paid_orders}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">
                        Total Paid Spending
                      </p>
                      <p className="mt-1 text-xl font-bold text-green-600">
                        {formatCurrency(selectedCustomer.total_spent)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">
                        First Purchase
                      </p>
                      <p className="mt-1 font-bold text-gray-900">
                        {formatDate(selectedCustomer.first_purchase)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <h3 className="mb-3 font-semibold text-gray-900">
                      Contact & Address
                    </h3>

                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <strong>Address:</strong>{" "}
                        {selectedCustomer.address || "Not available"}
                      </p>

                      <p>
                        <strong>Landmark:</strong>{" "}
                        {selectedCustomer.landmark || "Not available"}
                      </p>

                      <p>
                        <strong>City:</strong>{" "}
                        {selectedCustomer.city || "Not available"}
                      </p>

                      <p>
                        <strong>State:</strong>{" "}
                        {selectedCustomer.state || "Not available"}
                      </p>

                      <p>
                        <strong>PIN Code:</strong>{" "}
                        {selectedCustomer.pin_code || "Not available"}
                      </p>

                      <p>
                        <strong>Latest Purchase:</strong>{" "}
                        {formatDate(selectedCustomer.last_purchase)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Purchase History */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Purchase History
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        All orders placed by this customer
                      </p>
                    </div>

                    <button
                      onClick={exportCustomerOrdersCSV}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      ↓ Export History
                    </button>
                  </div>

                  {selectedCustomer.orders.length === 0 ? (
                    <p className="p-6 text-center text-gray-500">
                      No orders found.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[650px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                          <tr>
                            <th className="px-4 py-3">Order ID</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Order Status</th>
                            <th className="px-4 py-3">Payment</th>
                            <th className="px-4 py-3">Links</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                          {selectedCustomer.orders.map((order) => (
                            <tr key={order.id}>
                              <td className="px-4 py-4 font-medium text-gray-800">
                                #{order.id.slice(0, 8)}
                              </td>

                              <td className="px-4 py-4 text-gray-600">
                                {formatDate(order.created_at)}
                              </td>

                              <td className="px-4 py-4 font-semibold text-gray-900">
                                {formatCurrency(order.total_amount)}
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor(order.status)}`}
                                >
                                  {order.status}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor(order.payment_status)}`}
                                >
                                  {order.payment_status}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex flex-col gap-2">
                                  <a
                                    href={`/paper-ink-store/my-orders/${encodeURIComponent(order.id)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-blue-600 hover:underline"
                                  >
                                    Details
                                  </a>

                                  <a
                                    href={`/paper-ink-store/my-orders/${encodeURIComponent(order.id)}/invoice`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-green-600 hover:underline"
                                  >
                                    Invoice
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Customer Management · A4 Paper & Printer Ink Store
        </p>
      </div>
    </main>
  );
}
