"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
};

type StoreOrder = {
  id: string;
  customer_name: string;
  mobile: string;
  address: string;
  landmark: string | null;
  city: string;
  state: string;
  pin_code: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
};

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Packed",
  "Shipped",
  "Completed",
  "Cancelled",
];

const PAYMENT_STATUSES = [
  "Pending",
  "Paid",
  "Failed",
];

export default function StoreOrdersAdminPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const savedPassword = sessionStorage.getItem(
      "storeAdminPassword"
    );

    if (savedPassword) {
      setPassword(savedPassword);
      loadOrders(savedPassword);
    }
  }, []);

  async function loadOrders(adminPassword: string) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/store-orders",
        {
          method: "GET",
          headers: {
            "x-admin-password": adminPassword,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        sessionStorage.removeItem("storeAdminPassword");
        setLoggedIn(false);
        setPassword("");

        throw new Error(
          data.error || "Unable to load orders."
        );
      }

      setOrders(data.orders || []);
      setLoggedIn(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!password.trim()) {
      setError("Please enter the admin password.");
      return;
    }

    sessionStorage.setItem(
      "storeAdminPassword",
      password
    );

    loadOrders(password);
  }

  function handleLogout() {
    sessionStorage.removeItem(
      "storeAdminPassword"
    );

    setLoggedIn(false);
    setPassword("");
    setOrders([]);
    setError("");
  }

  async function updateOrder(
    orderId: string,
    field: "status" | "payment_status",
    value: string
  ) {
    try {
      setUpdatingId(orderId);
      setError("");

      const response = await fetch(
        "/api/admin/store-orders",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": password,
          },
          body: JSON.stringify({
            orderId,
            [field]: value,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to update order."
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                [field]: value,
              }
            : order
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update order."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function statusClass(status: string) {
    switch (status) {
      case "Completed":
        return "status completed";

      case "Shipped":
        return "status shipped";

      case "Packed":
        return "status packed";

      case "Processing":
        return "status processing";

      case "Cancelled":
        return "status cancelled";

      default:
        return "status pending";
    }
  }

  function paymentClass(payment: string) {
    switch (payment) {
      case "Paid":
        return "payment paid";

      case "Failed":
        return "payment failed";

      default:
        return "payment pending";
    }
  }

  if (!loggedIn) {
    return (
      <main className="login-page">
        <div className="login-card">
          <div className="login-icon">🛍️</div>

          <h1>Store Admin</h1>

          <p>
            A4 Paper & Printer Ink Order Management
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="admin-password">
              Admin Password
            </label>

            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter admin password"
              autoComplete="off"
              autoFocus
            />

            <button
              type="button"
              className="show-password"
              onClick={() =>
                setShowPassword((current) => !current)
              }
            >
              {showPassword ? "Hide" : "Show"}
            </button>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
            >
              🔐 Login
            </button>
          </form>
        </div>

        <style jsx>{`
          .login-page {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            background: #f4f7fb;
            box-sizing: border-box;
          }

          .login-card {
            position: relative;
            width: 100%;
            max-width: 420px;
            padding: 35px;
            background: #ffffff;
            border-radius: 18px;
            box-shadow: 0 10px 35px rgba(0, 0, 0, 0.08);
            box-sizing: border-box;
          }

          .login-icon {
            text-align: center;
            font-size: 50px;
            margin-bottom: 10px;
          }

          .login-card h1 {
            margin: 0;
            text-align: center;
            color: #172033;
            font-size: 28px;
          }

          .login-card p {
            margin: 10px 0 30px;
            text-align: center;
            color: #667085;
            line-height: 1.5;
          }

          .login-card label {
            display: block;
            margin-bottom: 8px;
            color: #344054;
            font-size: 14px;
            font-weight: 600;
          }

          .login-card form {
            position: relative;
            width: 100%;
          }

          .login-card input {
            display: block;
            width: 100%;
            height: 50px;
            padding: 0 85px 0 14px;
            margin: 0;
            border: 1px solid #d0d5dd;
            border-radius: 10px;
            outline: none;
            background: #ffffff;
            color: #172033;
            font-size: 16px;
            font-family: inherit;
            box-sizing: border-box;
            cursor: text;
          }

          .login-card input:focus {
            border-color: #155eef;
            box-shadow: 0 0 0 3px rgba(21, 94, 239, 0.12);
          }

          .login-card input::placeholder {
            color: #98a2b3;
          }

          .show-password {
            position: absolute;
            top: 31px;
            right: 8px;
            height: 34px;
            padding: 0 10px;
            border: none;
            border-radius: 7px;
            background: #f2f4f7;
            color: #344054;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          }

          .show-password:hover {
            background: #e4e7ec;
          }

          .login-error {
            margin-top: 12px;
            padding: 10px 12px;
            border: 1px solid #fecdca;
            border-radius: 8px;
            background: #fff1f0;
            color: #d92d20;
            font-size: 14px;
          }

          .login-button {
            display: block;
            width: 100%;
            margin-top: 15px;
            padding: 14px;
            border: none;
            border-radius: 10px;
            background: #155eef;
            color: #ffffff;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
          }

          .login-button:hover {
            background: #004eeb;
          }

          @media (max-width: 500px) {
            .login-card {
              padding: 25px 20px;
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="container">
        <header className="header">
          <div>
            <h1>🛍️ Store Orders</h1>

            <p>
              A4 Paper & Printer Ink Order Management
            </p>
          </div>

          <div className="header-buttons">
            <Link
              href="/admin/store-products"
              className="manage-products"
            >
              🛒 Manage Products
            </Link>

            <button
              className="refresh"
              onClick={() => loadOrders(password)}
            >
              🔄 Refresh
            </button>

            <button
              className="logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="admin-error">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="message">
            Loading store orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="message">
            <div className="empty-icon">📦</div>

            <h2>No Store Orders Yet</h2>

            <p>
              A4 Paper and Printer Ink orders will appear
              here.
            </p>
          </div>
        ) : (
          <div className="orders">
            {orders.map((order) => (
              <div
                className="order-card"
                key={order.id}
              >
                <div className="order-header">
                  <div>
                    <h2>
                      Order #{order.id}
                    </h2>

                    <span className="date">
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  <div className="badges">
                    <span
                      className={statusClass(order.status)}
                    >
                      {order.status}
                    </span>

                    <span
                      className={paymentClass(
                        order.payment_status
                      )}
                    >
                      Payment: {order.payment_status}
                    </span>
                  </div>
                </div>

                <section>
                  <h3>👤 Customer Details</h3>

                  <div className="customer-grid">
                    <div>
                      <strong>Name</strong>
                      <span>
                        {order.customer_name}
                      </span>
                    </div>

                    <div>
                      <strong>Mobile</strong>
                      <span>{order.mobile}</span>
                    </div>

                    <div className="full">
                      <strong>
                        Delivery Address
                      </strong>

                      <span>
                        {order.address}
                      </span>

                      {order.landmark && (
                        <span>
                          Landmark: {order.landmark}
                        </span>
                      )}

                      <span>
                        {order.city}, {order.state} -{" "}
                        {order.pin_code}
                      </span>
                    </div>
                  </div>
                </section>

                <section>
                  <h3>🛒 Ordered Products</h3>

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Total</th>
                        </tr>
                      </thead>

                      <tbody>
                        {order.items?.map((item) => (
                          <tr key={item.id}>
                            <td>
                              {item.product_name}
                            </td>

                            <td>
                              ₹
                              {Number(item.price).toFixed(
                                2
                              )}
                            </td>

                            <td>
                              {item.quantity}
                            </td>

                            <td>
                              ₹
                              {Number(item.total).toFixed(
                                2
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="bottom">
                  <div className="total">
                    <span>Order Total</span>

                    <strong>
                      ₹
                      {Number(
                        order.total_amount
                      ).toFixed(2)}
                    </strong>
                  </div>

                  <div className="controls">
                    <div>
                      <label>
                        Order Status
                      </label>

                      <select
                        value={order.status}
                        disabled={
                          updatingId === order.id
                        }
                        onChange={(event) =>
                          updateOrder(
                            order.id,
                            "status",
                            event.target.value
                          )
                        }
                      >
                        {ORDER_STATUSES.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label>
                        Payment Status
                      </label>

                      <select
                        value={order.payment_status}
                        disabled={
                          updatingId === order.id
                        }
                        onChange={(event) =>
                          updateOrder(
                            order.id,
                            "payment_status",
                            event.target.value
                          )
                        }
                      >
                        {PAYMENT_STATUSES.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {updatingId === order.id && (
                  <div className="updating">
                    Updating order...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-page {
          min-height: 100vh;
          background: #f4f7fb;
          padding: 30px 18px 60px;
        }

        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          background: #ffffff;
          padding: 24px;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 25px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
        }

        .header h1 {
          margin: 0 0 6px;
          color: #172033;
          font-size: 28px;
        }

        .header p {
          margin: 0;
          color: #667085;
        }

        .header-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .manage-products {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 9px;
          padding: 11px 16px;
          background: #155eef;
          color: #ffffff;
          text-decoration: none;
          cursor: pointer;
          font-weight: 700;
          white-space: nowrap;
        }

        .manage-products:hover {
          background: #004eeb;
        }

        .refresh,
        .logout {
          border: none;
          border-radius: 9px;
          padding: 11px 16px;
          cursor: pointer;
          font-weight: 700;
          white-space: nowrap;
        }

        .refresh {
          background: #eef4ff;
          color: #155eef;
        }

        .logout {
          background: #fff1f0;
          color: #d92d20;
        }

        .admin-error {
          margin-bottom: 20px;
          padding: 12px 15px;
          border: 1px solid #fecdca;
          border-radius: 10px;
          background: #fff1f0;
          color: #d92d20;
        }

        .message {
          background: #ffffff;
          padding: 60px 20px;
          text-align: center;
          border-radius: 16px;
          color: #667085;
        }

        .message h2 {
          color: #172033;
        }

        .empty-icon {
          font-size: 55px;
        }

        .orders {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .order-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          padding-bottom: 18px;
          border-bottom: 1px solid #eaecf0;
        }

        .order-header h2 {
          margin: 0;
          color: #172033;
          font-size: 18px;
          word-break: break-all;
        }

        .date {
          display: block;
          color: #667085;
          font-size: 13px;
          margin-top: 5px;
        }

        .badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .status,
        .payment {
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .status.pending,
        .payment.pending {
          background: #fff7e6;
          color: #b54708;
        }

        .status.processing {
          background: #fff0e6;
          color: #c4320a;
        }

        .status.packed {
          background: #f4f3ff;
          color: #6938ef;
        }

        .status.shipped {
          background: #eef4ff;
          color: #175cd3;
        }

        .status.completed,
        .payment.paid {
          background: #ecfdf3;
          color: #027a48;
        }

        .status.cancelled,
        .payment.failed {
          background: #fff1f0;
          color: #d92d20;
        }

        section {
          padding: 20px 0;
          border-bottom: 1px solid #eaecf0;
        }

        section h3 {
          margin: 0 0 15px;
          color: #344054;
          font-size: 16px;
        }

        .customer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .customer-grid > div {
          background: #f8fafc;
          padding: 13px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .customer-grid .full {
          grid-column: 1 / -1;
        }

        .customer-grid strong {
          font-size: 12px;
          color: #667085;
          text-transform: uppercase;
        }

        .customer-grid span {
          color: #172033;
          font-size: 14px;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }

        th,
        td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eaecf0;
        }

        th {
          background: #f8fafc;
          color: #667085;
          font-size: 13px;
        }

        td {
          color: #344054;
          font-size: 14px;
        }

        .bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 25px;
          padding-top: 20px;
        }

        .total {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .total span {
          color: #667085;
          font-size: 13px;
        }

        .total strong {
          font-size: 25px;
          color: #172033;
        }

        .controls {
          display: flex;
          gap: 12px;
        }

        .controls > div {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .controls label {
          font-size: 12px;
          font-weight: 700;
          color: #667085;
        }

        .controls select {
          min-width: 155px;
          padding: 10px;
          border: 1px solid #d0d5dd;
          border-radius: 8px;
          background: #ffffff;
          color: #344054;
          cursor: pointer;
        }

        .updating {
          text-align: right;
          color: #155eef;
          font-size: 13px;
          font-weight: 600;
          margin-top: 15px;
        }

        @media (max-width: 700px) {
          .admin-page {
            padding: 15px 10px 40px;
          }

          .header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-buttons {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr;
          }

          .manage-products,
          .refresh,
          .logout {
            width: 100%;
            box-sizing: border-box;
          }

          .order-header {
            flex-direction: column;
          }

          .badges {
            justify-content: flex-start;
          }

          .customer-grid {
            grid-template-columns: 1fr;
          }

          .customer-grid .full {
            grid-column: auto;
          }

          .bottom {
            flex-direction: column;
            align-items: stretch;
          }

          .controls {
            flex-direction: column;
          }

          .controls select {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}