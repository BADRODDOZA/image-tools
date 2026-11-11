"use client";

import { useState } from "react";
import Link from "next/link";

type PVCOrder = {
  id: string;
  card_type: string | null;
  quantity: number | null;
  amount: string | number | null;
  payment_status: string | null;
  status: string | null;
  created_at: string;
};

type StoreOrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
};

type StoreOrder = {
  id: string;
  customer_name: string | null;
  mobile: string | null;
  address: string | null;
  landmark: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  total_amount: string | number | null;
  status: string | null;
  payment_status: string | null;
  created_at: string;
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");

  const [orderType, setOrderType] = useState<
    "PVC" | "STORE" | null
  >(null);

  const [pvcOrder, setPvcOrder] =
    useState<PVCOrder | null>(null);

  const [storeOrder, setStoreOrder] =
    useState<StoreOrder | null>(null);

  const [storeItems, setStoreItems] =
    useState<StoreOrderItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trackOrder = async () => {
    const id = orderId.trim().replace(/^#/, "");

    if (!id) {
      setError("Please enter your Order ID.");
      setPvcOrder(null);
      setStoreOrder(null);
      setStoreItems([]);
      setOrderType(null);
      return;
    }

    setLoading(true);
    setError("");

    setPvcOrder(null);
    setStoreOrder(null);
    setStoreItems([]);
    setOrderType(null);

    try {
      const response = await fetch(
        `/api/track-order?orderId=${encodeURIComponent(id)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.error ||
            "Order not found. Please check your Order ID."
        );
        return;
      }

      if (data.orderType === "PVC") {
        setOrderType("PVC");
        setPvcOrder(data.order);
      } else if (data.orderType === "STORE") {
        setOrderType("STORE");
        setStoreOrder(data.order);
        setStoreItems(data.items || []);
      }
    } catch (error) {
      console.error("Track order error:", error);

      setError(
        "Unable to track your order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Completed":
        return "#16a34a";

      case "Shipped":
        return "#2563eb";

      case "Printed":
        return "#7c3aed";

      case "Processing":
        return "#ea580c";

      case "Cancelled":
      case "Rejected":
        return "#dc2626";

      default:
        return "#d97706";
    }
  };

  const getPaymentColor = (status: string | null) => {
    switch (status) {
      case "Paid":
        return "#16a34a";

      case "Failed":
        return "#dc2626";

      default:
        return "#d97706";
    }
  };

  const renderTrackingTimeline = (
    status: string | null,
    type: "PVC" | "STORE"
  ) => {
    const steps =
      type === "PVC"
        ? ["Pending", "Processing", "Printed", "Shipped", "Completed"]
        : ["Pending", "Processing", "Packed", "Shipped", "Completed"];

    const currentStatus = status || "Pending";
    const terminalStatus =
      currentStatus === "Cancelled" || currentStatus === "Rejected";
    const currentIndex = steps.indexOf(currentStatus);

    return (
      <div
        style={{
          marginTop: "20px",
          marginBottom: "20px",
          padding: "20px 16px",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          background: "#ffffff",
        }}
      >
        <h3 style={{ margin: "0 0 18px", fontSize: "17px", color: "#111827" }}>
          Order Progress
        </h3>

        {terminalStatus ? (
          <div
            style={{
              padding: "13px",
              borderRadius: "9px",
              background: "#fef2f2",
              color: "#b91c1c",
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {currentStatus === "Cancelled"
              ? "This order has been cancelled."
              : "This order has been rejected."}
          </div>
        ) : (
          <div>
            {steps.map((step, index) => {
              const completed = currentIndex >= index;
              const isCurrent = currentIndex === index;

              return (
                <div
                  key={step}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    minHeight: index === steps.length - 1 ? "auto" : "48px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: "22px",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: completed ? "#16a34a" : "#e5e7eb",
                        border: isCurrent ? "3px solid #bbf7d0" : "none",
                        boxSizing: "border-box",
                      }}
                    />
                    {index !== steps.length - 1 && (
                      <div
                        style={{
                          width: "3px",
                          height: "30px",
                          background: currentIndex > index ? "#16a34a" : "#e5e7eb",
                        }}
                      />
                    )}
                  </div>

                  <div style={{ paddingBottom: "13px", marginTop: "-2px" }}>
                    <div
                      style={{
                        color: completed ? "#166534" : "#9ca3af",
                        fontWeight: isCurrent ? "800" : "600",
                        fontSize: "14px",
                      }}
                    >
                      {step}
                      {isCurrent ? " — Current status" : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "12px" }}>
          Progress updates when the order status is changed by the store.
        </p>
      </div>
    );
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "650px",
          margin: "0 auto",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontWeight: "600",
          }}
        >
          ← Back to Home
        </Link>

        <div
          style={{
            background: "#ffffff",
            marginTop: "20px",
            padding: "30px",
            borderRadius: "16px",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              margin: "0 0 10px",
              fontSize: "30px",
            }}
          >
            📦 Track Your Order
          </h1>

          <p
            style={{
              textAlign: "center",
              color: "#666",
              marginBottom: "30px",
              lineHeight: "1.6",
            }}
          >
            Enter your Order ID to track your
            PVC, A4 Paper, or Printer Ink order.
          </p>

          <label
            htmlFor="orderId"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Order ID
          </label>

          <input
            id="orderId"
            type="text"
            value={orderId}
            onChange={(e) =>
              setOrderId(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                trackOrder();
              }
            }}
            placeholder="Enter Order ID"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              fontSize: "16px",
              marginBottom: "15px",
            }}
          />

          <button
            type="button"
            onClick={trackOrder}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: loading
                ? "#93c5fd"
                : "#2563eb",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Checking..."
              : "Track Order"}
          </button>

          {error && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                borderRadius: "10px",
                background: "#fee2e2",
                color: "#991b1b",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {/* ================================================= */}
          {/* PVC ORDER */}
          {/* ================================================= */}

          {orderType === "PVC" &&
            pvcOrder && (
              <div style={{ marginTop: "30px" }}>
                <div
                  style={{
                    textAlign: "center",
                    padding: "22px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#64748b",
                      marginBottom: "8px",
                    }}
                  >
                    PVC ORDER STATUS
                  </div>

                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "800",
                      color: getStatusColor(
                        pvcOrder.status
                      ),
                    }}
                  >
                    {pvcOrder.status || "Pending"}
                  </div>
                </div>

                {renderTrackingTimeline(pvcOrder.status, "PVC")}

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "16px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <strong>Order ID</strong>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#555",
                        fontSize: "14px",
                        wordBreak: "break-all",
                      }}
                    >
                      {pvcOrder.id}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <strong>Order Type</strong>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#555",
                      }}
                    >
                      🪪 PVC Printing
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <strong>Card Type</strong>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#555",
                      }}
                    >
                      {pvcOrder.card_type || "-"}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <strong>Quantity</strong>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#555",
                      }}
                    >
                      {pvcOrder.quantity ?? "-"}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <strong>Amount</strong>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#555",
                      }}
                    >
                      ₹{pvcOrder.amount ?? "0"}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <strong>Payment Status</strong>

                    <div
                      style={{
                        marginTop: "6px",
                        fontWeight: "700",
                        color: getPaymentColor(
                          pvcOrder.payment_status
                        ),
                      }}
                    >
                      {pvcOrder.payment_status ||
                        "Pending"}
                    </div>
                  </div>

                  <div style={{ padding: "16px" }}>
                    <strong>Order Date</strong>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#555",
                      }}
                    >
                      {new Date(
                        pvcOrder.created_at
                      ).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "20px",
                    padding: "15px",
                    borderRadius: "10px",
                    background: "#eff6ff",
                    color: "#1e40af",
                    textAlign: "center",
                    fontSize: "14px",
                  }}
                >
                  🪪 This is your PVC Printing order.
                </div>
              </div>
            )}

          {/* ================================================= */}
          {/* A4 PAPER / PRINTER INK ORDER */}
          {/* ================================================= */}

          {orderType === "STORE" &&
            storeOrder && (
              <div style={{ marginTop: "30px" }}>
                <div
                  style={{
                    textAlign: "center",
                    padding: "22px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#64748b",
                      marginBottom: "8px",
                    }}
                  >
                    PAPER & INK ORDER STATUS
                  </div>

                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "800",
                      color: getStatusColor(
                        storeOrder.status
                      ),
                    }}
                  >
                    {storeOrder.status || "Pending"}
                  </div>
                </div>

                {renderTrackingTimeline(storeOrder.status, "STORE")}

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "16px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <strong>Order ID</strong>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#555",
                        fontSize: "14px",
                        wordBreak: "break-all",
                      }}
                    >
                      {storeOrder.id}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <strong>Order Type</strong>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#555",
                      }}
                    >
                      🛒 A4 Paper & Printer Ink
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <strong>Products</strong>

                    <div
                      style={{
                        marginTop: "12px",
                      }}
                    >
                      {storeItems.length === 0 ? (
                        <div
                          style={{
                            color: "#666",
                          }}
                        >
                          No products found.
                        </div>
                      ) : (
                        storeItems.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              padding: "12px 0",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "700",
                                color: "#111827",
                              }}
                            >
                              {item.product_name}
                            </div>

                            <div
                              style={{
                                marginTop: "4px",
                                color: "#64748b",
                                fontSize: "14px",
                              }}
                            >
                              Quantity: {item.quantity}
                            </div>

                            <div
                              style={{
                                marginTop: "3px",
                                color: "#64748b",
                                fontSize: "14px",
                              }}
                            >
                              ₹{item.price} ×{" "}
                              {item.quantity} = ₹
                              {item.total}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <strong>Total Amount</strong>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#111827",
                        fontWeight: "800",
                        fontSize: "20px",
                      }}
                    >
                      ₹{storeOrder.total_amount ?? "0"}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <strong>Payment Status</strong>

                    <div
                      style={{
                        marginTop: "6px",
                        fontWeight: "700",
                        color: getPaymentColor(
                          storeOrder.payment_status
                        ),
                      }}
                    >
                      {storeOrder.payment_status ||
                        "Pending"}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <strong>Order Date</strong>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#555",
                      }}
                    >
                      {new Date(
                        storeOrder.created_at
                      ).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div style={{ padding: "16px" }}>
                    <strong>Delivery Address</strong>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#555",
                        lineHeight: "1.6",
                      }}
                    >
                      {storeOrder.address || "-"}
                      <br />

                      {storeOrder.landmark && (
                        <>
                          Landmark:{" "}
                          {storeOrder.landmark}
                          <br />
                        </>
                      )}

                      {storeOrder.city || "-"},{" "}
                      {storeOrder.state || "-"}
                      <br />

                      PIN: {storeOrder.pin_code || "-"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "20px",
                    padding: "15px",
                    borderRadius: "10px",
                    background: "#eff6ff",
                    color: "#1e40af",
                    textAlign: "center",
                    fontSize: "14px",
                  }}
                >
                  🛒 This is your A4 Paper & Printer Ink order.
                </div>
              </div>
            )}
        </div>
      </div>
    </main>
  );
}