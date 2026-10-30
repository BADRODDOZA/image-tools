
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type OrderItem = {
  id?: string;
  order_id?: string;
  product_id?: string;
  product_name?: string;
  category?: string | null;
  quantity?: number;
  price?: number;
  total?: number;
};

type StoreOrder = {
  id: string;
  customer_name?: string;
  mobile?: string;
  total_amount?: number;
  status?: string;
  payment_status?: string;
  created_at?: string;
  items?: OrderItem[];
};

type ProductStat = {
  product_id: string;
  product_name: string;
  category: string;
  quantity: number;
  revenue: number;
  orders: number;
};

type CategoryStat = {
  category: string;
  quantity: number;
  revenue: number;
};

function money(value: number) {
  return "₹" + value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getCategory(value?: string | null) {
  const category = (value || "").toLowerCase();

  if (category.includes("paper")) return "A4 Paper";
  if (category.includes("ink")) return "Printer Ink";

  return value || "Other";
}

function getItemTotal(item: OrderItem) {
  const total = Number(item.total);

  if (Number.isFinite(total) && total >= 0) {
    return total;
  }

  return Number(item.quantity || 0) * Number(item.price || 0);
}

export default function StoreProductPerformancePage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("quantity");

  const loadData = useCallback(async (adminPassword: string) => {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load store orders.");
      }

      const receivedOrders: StoreOrder[] = Array.isArray(data.orders)
        ? data.orders
        : Array.isArray(data.data?.orders)
        ? data.data.orders
        : [];

      const receivedItems: OrderItem[] = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.data?.items)
        ? data.data.items
        : receivedOrders.flatMap((order) =>
            Array.isArray(order.items)
              ? order.items.map((item) => ({
                  ...item,
                  order_id: item.order_id || order.id,
                }))
              : []
          );

      setOrders(receivedOrders);
      setItems(receivedItems);
      setLoggedIn(true);
      sessionStorage.setItem("storeAdminPassword", adminPassword);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedPassword = sessionStorage.getItem("storeAdminPassword");

    if (savedPassword) {
      setPassword(savedPassword);
      loadData(savedPassword);
    }
  }, [loadData]);

  const paidOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        String(order.payment_status || "").toLowerCase() === "paid"
    );
  }, [orders]);

  const filteredPaidOrders = useMemo(() => {
    if (range === "all") return paidOrders;

    const days = Number(range);
    const cutoff = new Date();

    cutoff.setDate(cutoff.getDate() - days);

    return paidOrders.filter((order) => {
      if (!order.created_at) return false;

      return new Date(order.created_at) >= cutoff;
    });
  }, [paidOrders, range]);

  const filteredOrderIds = useMemo(() => {
    return new Set(filteredPaidOrders.map((order) => order.id));
  }, [filteredPaidOrders]);

  const productStats = useMemo(() => {
    const stats = new Map<string, ProductStat>();

    items.forEach((item) => {
      if (!item.order_id || !filteredOrderIds.has(item.order_id)) {
        return;
      }

      const productId = item.product_id || item.product_name || "unknown";
      const productName = item.product_name || "Unknown Product";
      const category = getCategory(item.category);
      const quantity = Number(item.quantity || 0);
      const revenue = getItemTotal(item);

      const existing = stats.get(productId);

      if (existing) {
        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.orders += 1;
      } else {
        stats.set(productId, {
          product_id: productId,
          product_name: productName,
          category,
          quantity,
          revenue,
          orders: 1,
        });
      }
    });

    return Array.from(stats.values());
  }, [items, filteredOrderIds]);

  const categoryStats = useMemo(() => {
    const categories = new Map<string, CategoryStat>();

    productStats.forEach((product) => {
      const existing = categories.get(product.category);

      if (existing) {
        existing.quantity += product.quantity;
        existing.revenue += product.revenue;
      } else {
        categories.set(product.category, {
          category: product.category,
          quantity: product.quantity,
          revenue: product.revenue,
        });
      }
    });

    return Array.from(categories.values()).sort(
      (a, b) => b.revenue - a.revenue
    );
  }, [productStats]);

  const totalRevenue = filteredPaidOrders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );

  const totalUnits = productStats.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  const totalProducts = productStats.length;

  const averageOrderValue =
    filteredPaidOrders.length > 0
      ? totalRevenue / filteredPaidOrders.length
      : 0;

  const paperRevenue = categoryStats.find(
    (item) => item.category === "A4 Paper"
  )?.revenue || 0;

  const inkRevenue = categoryStats.find(
    (item) => item.category === "Printer Ink"
  )?.revenue || 0;

  const filteredProducts = useMemo(() => {
    let result = [...productStats];

    if (categoryFilter !== "All") {
      result = result.filter(
        (product) => product.category === categoryFilter
      );
    }

    if (search.trim()) {
      const term = search.toLowerCase();

      result = result.filter(
        (product) =>
          product.product_name.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term)
      );
    }

    if (sortBy === "quantity") {
      result.sort((a, b) => b.quantity - a.quantity);
    } else if (sortBy === "revenue") {
      result.sort((a, b) => b.revenue - a.revenue);
    } else if (sortBy === "orders") {
      result.sort((a, b) => b.orders - a.orders);
    } else if (sortBy === "low") {
      result.sort((a, b) => a.quantity - b.quantity);
    }

    return result;
  }, [productStats, categoryFilter, search, sortBy]);

  const topProducts = [...productStats]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const lowestProducts = [...productStats]
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);

  function exportCSV() {
    const rows = [
      [
        "Product Name",
        "Category",
        "Units Sold",
        "Revenue",
        "Order Count",
      ],
      ...filteredProducts.map((product) => [
        product.product_name,
        product.category,
        product.quantity,
        product.revenue.toFixed(2),
        product.orders,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "store-product-performance.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  function logout() {
    sessionStorage.removeItem("storeAdminPassword");
    setPassword("");
    setLoggedIn(false);
    setOrders([]);
    setItems([]);
  }

  const cardStyle = {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "18px",
    minWidth: "0",
  } as const;

  const buttonStyle = {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
  } as const;

  if (!loggedIn) {
    return (
      <main style={{
        maxWidth: "420px",
        margin: "70px auto",
        padding: "24px",
      }}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>
            Product Performance Dashboard
          </h1>

          <p style={{ color: "#6b7280", marginTop: "8px" }}>
            Enter your Store Admin password to continue.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              loadData(password);
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin password"
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                marginTop: "18px",
                marginBottom: "12px",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                width: "100%",
                background: "#111827",
                color: "white",
              }}
            >
              {loading ? "Checking..." : "Login"}
            </button>
          </form>

          {error && (
            <p style={{ color: "#dc2626", marginTop: "12px" }}>
              {error}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main style={{
      maxWidth: "1250px",
      margin: "30px auto",
      padding: "16px",
      color: "#111827",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "24px",
      }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800 }}>
            Product Performance
          </h1>
          <p style={{ color: "#6b7280", marginTop: "5px" }}>
            A4 Paper and Printer Ink sales analysis
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => loadData(password)}
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>

          <button onClick={exportCSV} style={buttonStyle}>
            Export CSV
          </button>

          <button onClick={logout} style={buttonStyle}>
            Logout
          </button>
        </div>
      </div>

      {error && (
        <p style={{
          color: "#dc2626",
          background: "#fee2e2",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "16px",
        }}>
          {error}
        </p>
      )}

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        marginBottom: "20px",
      }}>
        <strong>Date range:</strong>

        <select
          value={range}
          onChange={(event) => setRange(event.target.value)}
          style={{ ...buttonStyle }}
        >
          <option value="all">All Time</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>

        <span style={{ color: "#6b7280", fontSize: "13px" }}>
          Revenue and units are calculated from paid orders only.
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: "14px",
        marginBottom: "24px",
      }}>
        <div style={cardStyle}>
          <p style={{ color: "#6b7280" }}>Paid Revenue</p>
          <h2 style={{ fontSize: "25px", fontWeight: 800, marginTop: "8px" }}>
            {money(totalRevenue)}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#6b7280" }}>Units Sold</p>
          <h2 style={{ fontSize: "25px", fontWeight: 800, marginTop: "8px" }}>
            {totalUnits}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#6b7280" }}>Products Sold</p>
          <h2 style={{ fontSize: "25px", fontWeight: 800, marginTop: "8px" }}>
            {totalProducts}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#6b7280" }}>Paid Orders</p>
          <h2 style={{ fontSize: "25px", fontWeight: 800, marginTop: "8px" }}>
            {filteredPaidOrders.length}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#6b7280" }}>Average Order Value</p>
          <h2 style={{ fontSize: "25px", fontWeight: 800, marginTop: "8px" }}>
            {money(averageOrderValue)}
          </h2>
        </div>
      </div>

      <h2 style={{
        fontSize: "21px",
        fontWeight: 800,
        marginBottom: "14px",
      }}>
        Category Performance
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px",
        marginBottom: "28px",
      }}>
        <div style={cardStyle}>
          <h3 style={{ fontWeight: 700 }}>📄 A4 Paper</h3>
          <p style={{ fontSize: "23px", fontWeight: 800, marginTop: "10px" }}>
            {money(paperRevenue)}
          </p>
          <p style={{ color: "#6b7280", fontSize: "13px" }}>
            Revenue from A4 Paper
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontWeight: 700 }}>🖨️ Printer Ink</h3>
          <p style={{ fontSize: "23px", fontWeight: 800, marginTop: "10px" }}>
            {money(inkRevenue)}
          </p>
          <p style={{ color: "#6b7280", fontSize: "13px" }}>
            Revenue from Printer Ink
          </p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        marginBottom: "28px",
      }}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: "19px", fontWeight: 800, marginBottom: "14px" }}>
            🏆 Top Selling Products
          </h2>

          {topProducts.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No paid product sales found.</p>
          ) : (
            topProducts.map((product, index) => (
              <div
                key={product.product_id}
                style={{
                  padding: "11px 0",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <strong>{index + 1}. {product.product_name}</strong>
                <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>
                  {product.category} · {product.quantity} units · {money(product.revenue)}
                </p>
              </div>
            ))
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: "19px", fontWeight: 800, marginBottom: "14px" }}>
            Lowest Selling Products
          </h2>

          {lowestProducts.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No paid product sales found.</p>
          ) : (
            lowestProducts.map((product) => (
              <div
                key={product.product_id}
                style={{
                  padding: "11px 0",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <strong>{product.product_name}</strong>
                <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>
                  {product.category} · {product.quantity} units · {money(product.revenue)}
                </p>
              </div>
            ))
          )}

          <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "10px" }}>
            This list compares products that have at least one paid sale.
          </p>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800 }}>
            All Product Performance
          </h2>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            style={buttonStyle}
          >
            <option value="quantity">Most Units Sold</option>
            <option value="revenue">Highest Revenue</option>
            <option value="orders">Most Orders</option>
            <option value="low">Lowest Units Sold</option>
          </select>
        </div>

        <div style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product..."
            style={{
              flex: 1,
              minWidth: "180px",
              padding: "11px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
            }}
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            style={buttonStyle}
          >
            <option value="All">All Categories</option>
            <option value="A4 Paper">A4 Paper</option>
            <option value="Printer Ink">Printer Ink</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "650px",
          }}>
            <thead>
              <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                <th style={{ padding: "12px" }}>Product</th>
                <th style={{ padding: "12px" }}>Category</th>
                <th style={{ padding: "12px" }}>Units Sold</th>
                <th style={{ padding: "12px" }}>Orders</th>
                <th style={{ padding: "12px" }}>Revenue</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{
                    padding: "25px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}>
                    No product sales found for this filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.product_id}
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                  >
                    <td style={{ padding: "12px", fontWeight: 600 }}>
                      {product.product_name}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {product.category}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {product.quantity}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {product.orders}
                    </td>
                    <td style={{ padding: "12px", fontWeight: 700 }}>
                      {money(product.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{
        color: "#9ca3af",
        fontSize: "12px",
        marginTop: "18px",
        textAlign: "center",
      }}>
        Product Performance Dashboard · A4 Paper & Printer Ink Store
      </p>
    </main>
  );
}
