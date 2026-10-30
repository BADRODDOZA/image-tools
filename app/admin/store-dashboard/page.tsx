"use client";

import { useEffect, useState } from "react";

type DashboardData = {
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    packed: number;
    shipped: number;
    completed: number;
    cancelled: number;
  };
  sales: {
    total: number;
    paid: number;
  };
  recentOrders: RecentOrder[];
};

type RecentOrder = {
  id: string;
  customer_name: string;
  mobile: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
};

export default function StoreDashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [password, setPassword] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  useEffect(() => {
    const savedPassword =
      sessionStorage.getItem(
        "storeAdminPassword"
      );

    if (savedPassword) {
      setPassword(savedPassword);
      setLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      loadDashboard();
    }
  }, [loggedIn]);

  async function login() {
    setError("");
    setSuccess("");

    if (!password.trim()) {
      setError(
        "Please enter admin password."
      );
      return;
    }

    setLoginLoading(true);

    try {
      const response = await fetch(
        "/api/admin/store-products",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            password: password.trim(),
          }),
        }
      );

      const text =
        await response.text();

      let data: any = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          "Invalid response from server."
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Invalid admin password."
        );
      }

      sessionStorage.setItem(
        "storeAdminPassword",
        password.trim()
      );

      setLoggedIn(true);

      setSuccess(
        "Login successful."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const adminPassword =
      sessionStorage.getItem(
        "storeAdminPassword"
      );

    if (!adminPassword) {
      setLoggedIn(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "/api/admin/store-dashboard",
        {
          method: "GET",
          headers: {
            "x-admin-password":
              adminPassword,
          },
          cache: "no-store",
        }
      );

      const text =
        await response.text();

      let data: any = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          "Invalid dashboard response."
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to load dashboard."
        );
      }

      setDashboard(
        data.dashboard
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(
      "storeAdminPassword"
    );

    setLoggedIn(false);
    setDashboard(null);
    setPassword("");
    setSuccess("");
    setError("");
  }

  function formatMoney(
    amount: number
  ) {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(
    date: string
  ) {
    if (!date) {
      return "-";
    }

    return new Date(
      date
    ).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function statusClass(
    status: string
  ) {
    const value =
      String(
        status || ""
      ).toLowerCase();

    if (
      value === "completed"
    ) {
      return "status completed";
    }

    if (
      value === "cancelled"
    ) {
      return "status cancelled";
    }

    if (
      value === "shipped"
    ) {
      return "status shipped";
    }

    if (
      value === "packed"
    ) {
      return "status packed";
    }

    if (
      value === "processing"
    ) {
      return "status processing";
    }

    return "status pending";
  }

  /*
   * LOGIN SCREEN
   */

  if (!loggedIn) {
    return (
      <main className="login-page">
        <div className="login-card">
          <div className="login-icon">
            🛍️
          </div>

          <h1>
            Store Dashboard
          </h1>

          <p className="login-subtitle">
            A4 Paper & Printer Ink
          </p>

          <div className="form-group">
            <label htmlFor="store-admin-password">
              Admin Password
            </label>

            <input
              id="store-admin-password"
              name="store-admin-password"
              className="password-input"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  login();
                }
              }}
              placeholder="Enter admin password"
              autoComplete="current-password"
            />

            <button
              type="button"
              className="show-hide-button"
              onClick={() =>
                setShowPassword(
                  (value) => !value
                )
              }
            >
              {showPassword
                ? "Hide"
                : "Show"}
            </button>
          </div>

          {error && (
            <div className="message error">
              {error}
            </div>
          )}

          {success && (
            <div className="message success">
              {success}
            </div>
          )}

          <button
            type="button"
            className="login-button"
            onClick={login}
            disabled={loginLoading}
          >
            {loginLoading
              ? "Logging in..."
              : "🔐 Login"}
          </button>
        </div>

        <style jsx>{`
          .login-page {
            min-height: 100vh;
            width: 100%;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: #f5f7fb;
          }

          .login-card {
            width: 100%;
            max-width: 420px;
            box-sizing: border-box;
            background: #ffffff;
            border-radius: 18px;
            padding: 32px;
            box-shadow: 0 10px 35px
              rgba(0, 0, 0, 0.08);
          }

          .login-icon {
            width: 100%;
            text-align: center;
            font-size: 48px;
            margin-bottom: 10px;
          }

          .login-card h1 {
            margin: 0;
            padding: 0;
            text-align: center;
            font-size: 28px;
            line-height: 1.3;
            color: #111827;
          }

          .login-subtitle {
            margin: 8px 0 28px;
            text-align: center;
            color: #6b7280;
            font-size: 15px;
          }

          .form-group {
            width: 100%;
            box-sizing: border-box;
          }

          .form-group label {
            display: block !important;
            width: 100%;
            margin: 0 0 8px 0;
            padding: 0;
            color: #111827;
            font-size: 15px;
            font-weight: 600;
          }

          .password-input {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;

            width: 100% !important;
            height: 50px !important;
            min-height: 50px !important;
            box-sizing: border-box !important;

            margin: 0 !important;
            padding: 12px 14px !important;

            border: 1px solid #cbd5e1 !important;
            border-radius: 10px !important;

            outline: none !important;

            background: #ffffff !important;
            color: #111827 !important;

            font-family: Arial, sans-serif !important;
            font-size: 16px !important;
            line-height: 24px !important;

            appearance: auto !important;
            -webkit-appearance: auto !important;
          }

          .password-input::placeholder {
            color: #9ca3af !important;
            opacity: 1 !important;
          }

          .password-input:focus {
            border-color: #2563eb !important;
            box-shadow: 0 0 0 3px
              rgba(37, 99, 235, 0.1) !important;
          }

          .show-hide-button {
            display: inline-block !important;

            margin-top: 10px;

            border: 0;
            border-radius: 8px;

            background: #f3f4f6;
            color: #111827;

            padding: 9px 15px;

            font-size: 14px;
            font-weight: 600;

            cursor: pointer;
          }

          .show-hide-button:hover {
            background: #e5e7eb;
          }

          .login-button {
            display: block !important;

            width: 100% !important;
            min-height: 50px;

            margin-top: 18px !important;

            border: 0;
            border-radius: 10px;

            background: #111827;
            color: #ffffff;

            padding: 13px 16px;

            font-size: 16px;
            font-weight: 700;

            cursor: pointer;
          }

          .login-button:hover {
            background: #1f2937;
          }

          .login-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .message {
            width: 100%;
            box-sizing: border-box;

            margin-top: 14px;
            padding: 11px 13px;

            border-radius: 9px;

            font-size: 14px;
            line-height: 20px;
          }

          .error {
            background: #fee2e2;
            color: #991b1b;
          }

          .success {
            background: #dcfce7;
            color: #166534;
          }

          @media (max-width: 480px) {
            .login-page {
              padding: 16px;
            }

            .login-card {
              padding: 24px 20px;
            }

            .login-card h1 {
              font-size: 24px;
            }
          }
        `}</style>
      </main>
    );
  }

  /*
   * DASHBOARD
   */

  return (
    <main className="dashboard">
      <div className="container">
        <header className="header">
          <div className="title-row">
            <span className="title-icon">
              🛍️
            </span>

            <div>
              <h1>
                Store Dashboard
              </h1>

              <p>
                A4 Paper & Printer Ink
                Management
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button
              type="button"
              onClick={
                loadDashboard
              }
              disabled={loading}
              className="refresh-button"
            >
              🔄{" "}
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={logout}
              className="logout-button"
            >
              🚪 Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="message error">
            {error}
          </div>
        )}

        {success && (
          <div className="message success">
            {success}
          </div>
        )}

        {loading &&
        !dashboard ? (
          <div className="loading">
            Loading dashboard...
          </div>
        ) : dashboard ? (
          <>
            <section className="section">
              <h2>
                📦 Product Overview
              </h2>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    📦
                  </div>

                  <div>
                    <span>
                      Total Products
                    </span>

                    <strong>
                      {
                        dashboard
                          .products
                          .total
                      }
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    ✅
                  </div>

                  <div>
                    <span>
                      Active Products
                    </span>

                    <strong>
                      {
                        dashboard
                          .products
                          .active
                      }
                    </strong>
                  </div>
                </div>

                <div className="stat-card warning-card">
                  <div className="stat-icon">
                    ⚠️
                  </div>

                  <div>
                    <span>
                      Low Stock
                    </span>

                    <strong>
                      {
                        dashboard
                          .products
                          .lowStock
                      }
                    </strong>
                  </div>
                </div>

                <div className="stat-card danger-card">
                  <div className="stat-icon">
                    ❌
                  </div>

                  <div>
                    <span>
                      Out of Stock
                    </span>

                    <strong>
                      {
                        dashboard
                          .products
                          .outOfStock
                      }
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="section">
              <h2>
                🛒 Order Overview
              </h2>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    🛒
                  </div>

                  <div>
                    <span>
                      Total Orders
                    </span>

                    <strong>
                      {
                        dashboard
                          .orders
                          .total
                      }
                    </strong>
                  </div>
                </div>

                <div className="stat-card warning-card">
                  <div className="stat-icon">
                    🕐
                  </div>

                  <div>
                    <span>
                      Pending
                    </span>

                    <strong>
                      {
                        dashboard
                          .orders
                          .pending
                      }
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    ⚙️
                  </div>

                  <div>
                    <span>
                      Processing
                    </span>

                    <strong>
                      {
                        dashboard
                          .orders
                          .processing
                      }
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    📦
                  </div>

                  <div>
                    <span>
                      Packed
                    </span>

                    <strong>
                      {
                        dashboard
                          .orders
                          .packed
                      }
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    🚚
                  </div>

                  <div>
                    <span>
                      Shipped
                    </span>

                    <strong>
                      {
                        dashboard
                          .orders
                          .shipped
                      }
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    🎉
                  </div>

                  <div>
                    <span>
                      Completed
                    </span>

                    <strong>
                      {
                        dashboard
                          .orders
                          .completed
                      }
                    </strong>
                  </div>
                </div>

                <div className="stat-card danger-card">
                  <div className="stat-icon">
                    ❌
                  </div>

                  <div>
                    <span>
                      Cancelled
                    </span>

                    <strong>
                      {
                        dashboard
                          .orders
                          .cancelled
                      }
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="section">
              <h2>
                💰 Sales Overview
              </h2>

              <div className="sales-grid">
                <div className="sales-card">
                  <span>
                    Total Order Value
                  </span>

                  <strong>
                    {formatMoney(
                      dashboard.sales
                        .total
                    )}
                  </strong>
                </div>

                <div className="sales-card">
                  <span>
                    Paid Sales
                  </span>

                  <strong>
                    {formatMoney(
                      dashboard.sales
                        .paid
                    )}
                  </strong>
                </div>
              </div>
            </section>

            <section className="section">
              <div className="section-header">
                <h2>
                  📋 Recent Orders
                </h2>

                <span className="order-count">
                  {
                    dashboard
                      .recentOrders
                      .length
                  }{" "}
                  shown
                </span>
              </div>

              {dashboard
                .recentOrders
                .length === 0 ? (
                <div className="empty">
                  No store orders yet.
                </div>
              ) : (
                <div className="orders-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          Order ID
                        </th>

                        <th>
                          Customer
                        </th>

                        <th>
                          Amount
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Payment
                        </th>

                        <th>
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboard.recentOrders.map(
                        (order) => (
                          <tr
                            key={
                              order.id
                            }
                          >
                            <td>
                              <strong>
                                #
                                {order.id.slice(
                                  0,
                                  8
                                )}
                              </strong>
                            </td>

                            <td>
                              <div className="customer">
                                <strong>
                                  {
                                    order.customer_name
                                  }
                                </strong>

                                <span>
                                  {
                                    order.mobile
                                  }
                                </span>
                              </div>
                            </td>

                            <td>
                              <strong>
                                {formatMoney(
                                  order.total_amount
                                )}
                              </strong>
                            </td>

                            <td>
                              <span
                                className={statusClass(
                                  order.status
                                )}
                              >
                                {
                                  order.status
                                }
                              </span>
                            </td>

                            <td>
                              <span
                                className={
                                  String(
                                    order.payment_status ||
                                      ""
                                  ).toLowerCase() ===
                                  "paid"
                                    ? "payment paid"
                                    : "payment pending"
                                }
                              >
                                {
                                  order.payment_status
                                }
                              </span>
                            </td>

                            <td>
                              {formatDate(
                                order.created_at
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #f5f7fb;
          padding: 24px;
        }

        .container {
          max-width: 1250px;
          margin: 0 auto;
        }

        .header {
          background: #ffffff;
          border-radius: 18px;
          padding: 22px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 22px;
          box-shadow: 0 5px 20px
            rgba(0, 0, 0, 0.05);
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .title-icon {
          font-size: 42px;
        }

        .header h1 {
          margin: 0;
          font-size: 28px;
          color: #111827;
        }

        .header p {
          margin: 4px 0 0;
          color: #6b7280;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .header-actions button {
          border: 0;
          border-radius: 9px;
          padding: 11px 15px;
          font-weight: 600;
          cursor: pointer;
        }

        .refresh-button {
          background: #eef2ff;
          color: #3730a3;
        }

        .logout-button {
          background: #fee2e2;
          color: #991b1b;
        }

        .header-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .section {
          margin-bottom: 24px;
        }

        .section h2 {
          margin: 0 0 14px;
          font-size: 20px;
          color: #111827;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(210px, 1fr)
          );
          gap: 15px;
        }

        .stat-card {
          background: #ffffff;
          border-radius: 15px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 4px 15px
            rgba(0, 0, 0, 0.04);
        }

        .stat-icon {
          font-size: 30px;
        }

        .stat-card span {
          display: block;
          color: #6b7280;
          font-size: 14px;
        }

        .stat-card strong {
          display: block;
          font-size: 28px;
          margin-top: 4px;
          color: #111827;
        }

        .warning-card {
          border-left: 4px solid #f59e0b;
        }

        .danger-card {
          border-left: 4px solid #ef4444;
        }

        .sales-grid {
          display: grid;
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          );
          gap: 15px;
        }

        .sales-card {
          background: #ffffff;
          border-radius: 15px;
          padding: 24px;
          box-shadow: 0 4px 15px
            rgba(0, 0, 0, 0.04);
        }

        .sales-card span {
          display: block;
          color: #6b7280;
          font-size: 14px;
        }

        .sales-card strong {
          display: block;
          font-size: 32px;
          margin-top: 7px;
          color: #111827;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .order-count {
          color: #6b7280;
          font-size: 14px;
        }

        .orders-table-wrapper {
          background: #ffffff;
          border-radius: 15px;
          overflow-x: auto;
          box-shadow: 0 4px 15px
            rgba(0, 0, 0, 0.04);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
        }

        th,
        td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid #eef0f4;
        }

        th {
          background: #f9fafb;
          font-size: 13px;
          color: #6b7280;
          text-transform: uppercase;
        }

        td {
          font-size: 14px;
          color: #111827;
        }

        .customer strong,
        .customer span {
          display: block;
        }

        .customer span {
          color: #6b7280;
          margin-top: 3px;
        }

        .status,
        .payment {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status.processing {
          background: #dbeafe;
          color: #1e40af;
        }

        .status.packed {
          background: #ede9fe;
          color: #6d28d9;
        }

        .status.shipped {
          background: #cffafe;
          color: #155e75;
        }

        .status.completed {
          background: #dcfce7;
          color: #166534;
        }

        .status.cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .payment.paid {
          background: #dcfce7;
          color: #166534;
        }

        .payment.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .empty {
          background: #ffffff;
          border-radius: 15px;
          padding: 35px;
          text-align: center;
          color: #6b7280;
        }

        .message {
          padding: 12px 15px;
          border-radius: 10px;
          margin-bottom: 18px;
        }

        .error {
          background: #fee2e2;
          color: #991b1b;
        }

        .success {
          background: #dcfce7;
          color: #166534;
        }

        .loading {
          background: #ffffff;
          padding: 40px;
          border-radius: 15px;
          text-align: center;
          color: #6b7280;
        }

        @media (max-width: 700px) {
          .dashboard {
            padding: 12px;
          }

          .header {
            align-items: flex-start;
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions button {
            flex: 1;
          }

          .header h1 {
            font-size: 23px;
          }

          .sales-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}