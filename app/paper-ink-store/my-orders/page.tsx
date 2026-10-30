
"use client";

import Link from "next/link";
import { useState } from "react";

type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price?: number;
  order_price?: number;
  total: number;
  image_url?: string | null;
  category?: string | null;
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

function normalizeStatus(status: string | null | undefined) {
  return String(status || "").trim().toLowerCase();
}

function formatStatus(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "pending") return "Pending";
  if (normalized === "processing") return "Processing";
  if (normalized === "packed") return "Packed";
  if (normalized === "shipped") return "Shipped";
  if (normalized === "completed") return "Completed";
  if (normalized === "cancelled") return "Cancelled";
  if (normalized === "rejected") return "Rejected";

  return status;
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return date;
  }
}

export default function MyOrdersPage() {
  const [mobile, setMobile] = useState("");
  const [orderId, setOrderId] = useState("");

  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const [cancelLoading, setCancelLoading] =
    useState<string | null>(null);

  const [cancelConfirmId, setCancelConfirmId] =
    useState<string | null>(null);

  async function searchOrders() {
    const cleanMobile = mobile.trim();
    const cleanOrderId = orderId.trim().replace(/^#/, "");

    if (!cleanMobile) {
      setError("Please enter your mobile number.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSearched(true);
      setOrders([]);

      let url =
        `/api/store-my-orders?mobile=${encodeURIComponent(
          cleanMobile
        )}`;

      if (cleanOrderId) {
        url += `&orderId=${encodeURIComponent(cleanOrderId)}`;
      }

      const response = await fetch(url, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load orders."
        );
      }

      if (!Array.isArray(data?.orders)) {
        console.error("My Orders API response:", data);

        throw new Error(
          data?.error || "Orders data was not returned."
        );
      }

      setOrders(data.orders);
    } catch (err) {
      console.error("Search orders error:", err);

      setOrders([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  async function cancelOrder(order: StoreOrder) {
    try {
      setCancelLoading(order.id);
      setError("");

      const response = await fetch(
        `/api/store-order/${order.id}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mobile: order.mobile,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to cancel order."
        );
      }

      setCancelConfirmId(null);

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id
            ? {
                ...currentOrder,
                status: "Cancelled",
              }
            : currentOrder
        )
      );

      alert("Your order has been cancelled successfully.");
    } catch (err) {
      console.error("Cancel order error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Unable to cancel order."
      );
    } finally {
      setCancelLoading(null);
    }
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "30px 20px 60px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 25 }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>
          📦 My Orders
        </h1>

        <p style={{ marginTop: 8, color: "#6b7280" }}>
          Check your A4 Paper & Printer Ink orders
          using your mobile number.
        </p>
      </div>

      {/* Search */}
      <section
        style={{
          padding: 20,
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          background: "#fff",
          marginBottom: 25,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 20 }}>
          🔎 Find Your Orders
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <input
            type="tel"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            placeholder="Mobile number"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 15,
            }}
          />

          <input
            type="text"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Order ID (optional)"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 15,
            }}
          />

          <button
            type="button"
            onClick={searchOrders}
            disabled={loading}
            style={{
              padding: "12px 18px",
              border: "none",
              borderRadius: 8,
              background: "#111827",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Searching..." : "🔎 Search Orders"}
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: 15,
            borderRadius: 10,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          style={{
            padding: 20,
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          Searching for your orders...
        </div>
      )}

      {/* No Orders */}
      {searched &&
        !loading &&
        orders.length === 0 &&
        !error && (
          <div
            style={{
              padding: 25,
              textAlign: "center",
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 10 }}>
              📭
            </div>

            <h2 style={{ margin: "0 0 8px" }}>
              No Orders Found
            </h2>

            <p style={{ color: "#6b7280" }}>
              We could not find any orders for this mobile number.
            </p>
          </div>
        )}

      {/* Orders */}
      <div
        style={{
          display: "grid",
          gap: 20,
        }}
      >
        {orders.map((order) => {
          const normalizedStatus = normalizeStatus(order.status);
          const canCancel = normalizedStatus === "pending";

          return (
            <section
              key={order.id}
              style={{
                padding: 20,
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: "#fff",
              }}
            >
              {/* Order Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 15,
                  flexWrap: "wrap",
                  marginBottom: 15,
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>
                    Order #{order.id}
                  </h2>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#6b7280",
                      fontSize: 14,
                    }}
                  >
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <div
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    background:
                      normalizedStatus === "pending"
                        ? "#fef3c7"
                        : normalizedStatus === "cancelled"
                        ? "#fee2e2"
                        : "#e5e7eb",
                    fontWeight: 700,
                  }}
                >
                  {formatStatus(order.status)}
                </div>
              </div>

              {/* Products */}
              <div style={{ display: "grid", gap: 10 }}>
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      padding: 10,
                      borderRadius: 10,
                      background: "#f9fafb",
                    }}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        style={{
                          width: 65,
                          height: 65,
                          objectFit: "contain",
                          borderRadius: 8,
                          background: "#fff",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 65,
                          height: 65,
                          borderRadius: 8,
                          background: "#e5e7eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        No Image
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>
                        {item.product_name}
                      </div>

                      {item.category && (
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: 13,
                            marginTop: 3,
                          }}
                        >
                          {item.category}
                        </div>
                      )}

                      <div style={{ marginTop: 4, fontSize: 14 }}>
                        Qty: {item.quantity}
                      </div>
                    </div>

                    <div style={{ fontWeight: 700 }}>
                      ₹{Number(item.total).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 18,
                  paddingTop: 15,
                  borderTop: "1px solid #e5e7eb",
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                <span>Total</span>
                <span>
                  ₹{Number(order.total_amount).toFixed(2)}
                </span>
              </div>

              {/* Cancel Confirmation */}
              {cancelConfirmId === order.id && (
                <div
                  style={{
                    marginTop: 18,
                    padding: 15,
                    borderRadius: 10,
                    background: "#fff7f7",
                    border: "1px solid #fecaca",
                  }}
                >
                  <strong style={{ color: "#991b1b" }}>
                    Are you sure you want to cancel this order?
                  </strong>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      marginTop: 12,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => cancelOrder(order)}
                      disabled={cancelLoading === order.id}
                      style={{
                        padding: "10px 16px",
                        border: "none",
                        borderRadius: 8,
                        background: "#dc2626",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                        opacity:
                          cancelLoading === order.id ? 0.7 : 1,
                      }}
                    >
                      {cancelLoading === order.id
                        ? "Cancelling..."
                        : "Yes, Cancel Order"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCancelConfirmId(null)}
                      disabled={cancelLoading === order.id}
                      style={{
                        padding: "10px 16px",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        background: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      No, Keep Order
                    </button>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 18,
                }}
              >
                <Link
                  href={`/paper-ink-store/my-orders/${order.id}`}
                  style={{
                    padding: "11px 15px",
                    borderRadius: 8,
                    background: "#111827",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  📋 Order Details
                </Link>

                <Link
                  href={`/track-order?orderId=${order.id}`}
                  style={{
                    padding: "11px 15px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    color: "#111827",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  📦 Track Order
                </Link>

                {canCancel && (
                  <button
                    type="button"
                    onClick={() => setCancelConfirmId(order.id)}
                    style={{
                      padding: "11px 15px",
                      border: "none",
                      borderRadius: 8,
                      background: "#dc2626",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ❌ Cancel Order
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Bottom Buttons */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 25,
        }}
      >
        <Link
          href="/paper-ink-store"
          style={{
            padding: "12px 18px",
            borderRadius: 8,
            background: "#111827",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          🛒 Continue Shopping
        </Link>

        <Link
          href="/"
          style={{
            padding: "12px 18px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            color: "#111827",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          🏠 Home
        </Link>
      </div>
    </main>
  );
}
