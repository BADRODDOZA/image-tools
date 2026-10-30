
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PVCOrderItem = {
  id: string;
  order_id: string;
  front_signed_url: string | null;
  back_signed_url: string | null;
  quantity: number | null;
};

type PVCOrder = {
  id: string;
  customer_name: string;
  mobile: string;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  card_type: string;
  document_url: string | null;
  quantity: number;
  amount: number;
  status: string;
  payment_status: string | null;
  created_at: string;
  pvc_order_items: PVCOrderItem[];
};

export default function AdminPVCOrdersPage() {
  const [orders, setOrders] = useState<PVCOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);

    const password = window.prompt(
      "Enter Store Admin password:"
    );

    if (!password) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/pvc-orders", {
        method: "GET",
        headers: {
          "x-admin-password": password,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || "Could not load PVC orders.");
        setLoading(false);
        return;
      }

      setOrders(result.orders || []);
    } catch (error) {
      console.error("PVC orders loading error:", error);
      alert("Unable to load PVC orders.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(
    orderId: string,
    newStatus: string
  ) {
    const password = window.prompt("Enter admin password:");

    if (!password) {
      return;
    }

    try {
      const response = await fetch("/api/admin/pvc-orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(
          result.error || "Could not update PVC order status."
        );
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: result.order.status,
              }
            : order
        )
      );

      alert("PVC order status saved successfully!");
    } catch (error) {
      console.error("PVC status update error:", error);
      alert("Unable to update PVC order status.");
    }
  }

  async function updatePaymentStatus(
    orderId: string,
    newPaymentStatus: string
  ) {
    const password = window.prompt("Enter admin password:");

    if (!password) {
      return;
    }

    try {
      const response = await fetch("/api/admin/pvc-orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          orderId,
          paymentStatus: newPaymentStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(
          result.error || "Could not update payment status."
        );
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                payment_status: result.order.payment_status,
              }
            : order
        )
      );

      alert("PVC payment status saved successfully!");
    } catch (error) {
      console.error("Payment status update error:", error);
      alert("Unable to update PVC payment status.");
    }
  }

  function openDocument(fileUrl: string | null) {
    if (!fileUrl) {
      alert("Document is not available.");
      return;
    }

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f4f6f9",
          padding: "30px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h1>Admin PVC Orders</h1>
          <p>Loading orders...</p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f6f9",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
            }}
          >
            Admin PVC Orders
          </h1>

          <Link
            href="/pvc-printing"
            style={{
              textDecoration: "none",
              background: "#2563eb",
              color: "#ffffff",
              padding: "10px 16px",
              borderRadius: "8px",
              fontWeight: "bold",
            }}
          >
            PVC Printing
          </Link>
        </div>

        {/* NO ORDERS */}

        {orders.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              padding: "30px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <h2>No PVC orders found</h2>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "22px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                }}
              >
                {/* ORDER HEADER */}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: "0 0 8px",
                        fontSize: "21px",
                      }}
                    >
                      Order #{order.id}
                    </h2>

                    <p
                      style={{
                        margin: 0,
                        color: "#666",
                        fontSize: "14px",
                      }}
                    >
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        background: "#e0f2fe",
                        color: "#0369a1",
                        padding: "7px 12px",
                        borderRadius: "20px",
                        fontWeight: "bold",
                        fontSize: "13px",
                      }}
                    >
                      {order.status || "Pending"}
                    </span>

                    <span
                      style={{
                        background:
                          order.payment_status === "Paid"
                            ? "#dcfce7"
                            : order.payment_status === "Failed"
                            ? "#fee2e2"
                            : "#fef3c7",
                        color:
                          order.payment_status === "Paid"
                            ? "#166534"
                            : order.payment_status === "Failed"
                            ? "#991b1b"
                            : "#92400e",
                        padding: "7px 12px",
                        borderRadius: "20px",
                        fontWeight: "bold",
                        fontSize: "13px",
                      }}
                    >
                      Payment: {order.payment_status || "Pending"}
                    </span>
                  </div>
                </div>

                {/* CUSTOMER INFORMATION */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "15px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <strong>Customer Name</strong>
                    <p>{order.customer_name}</p>
                  </div>

                  <div>
                    <strong>Mobile</strong>
                    <p>{order.mobile}</p>
                  </div>

                  <div>
                    <strong>Email</strong>
                    <p>{order.email || "Not provided"}</p>
                  </div>

                  <div>
                    <strong>Card Type</strong>
                    <p>{order.card_type}</p>
                  </div>

                  <div>
                    <strong>Quantity</strong>
                    <p>{order.quantity}</p>
                  </div>

                  <div>
                    <strong>Amount</strong>
                    <p>₹{order.amount}</p>
                  </div>

                  <div>
                    <strong>Address</strong>
                    <p>{order.address}</p>
                  </div>

                  <div>
                    <strong>City</strong>
                    <p>{order.city}</p>
                  </div>

                  <div>
                    <strong>State</strong>
                    <p>{order.state}</p>
                  </div>

                  <div>
                    <strong>Pincode</strong>
                    <p>{order.pincode}</p>
                  </div>
                </div>

                {/* ORDER STATUS */}

                <div
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      marginBottom: "7px",
                    }}
                  >
                    Order Status
                  </label>

                  <select
                    value={order.status || "Pending"}
                    onChange={(e) =>
                      updateStatus(order.id, e.target.value)
                    }
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      width: "100%",
                      maxWidth: "300px",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Printed">Printed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* PAYMENT STATUS */}

                <div
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      marginBottom: "7px",
                    }}
                  >
                    Payment Status
                  </label>

                  <select
                    value={order.payment_status || "Pending"}
                    onChange={(e) =>
                      updatePaymentStatus(order.id, e.target.value)
                    }
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      width: "100%",
                      maxWidth: "300px",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                {/* DOCUMENTS */}

                <div
                  style={{
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: "20px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 15px",
                    }}
                  >
                    Uploaded Documents
                  </h3>

                  {(order.pvc_order_items || []).length === 0 ? (
                    <p
                      style={{
                        color: "#777",
                      }}
                    >
                      No documents found for this order.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gap: "15px",
                      }}
                    >
                      {(order.pvc_order_items || []).map(
                        (item, index) => (
                          <div
                            key={item.id}
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: "10px",
                              padding: "15px",
                            }}
                          >
                            <h4
                              style={{
                                margin: "0 0 12px",
                                fontSize: "17px",
                              }}
                            >
                              Card #{index + 1}
                            </h4>

                            <p
                              style={{
                                margin: "0 0 12px",
                              }}
                            >
                              <strong>Quantity:</strong>{" "}
                              {item.quantity || 1}
                            </p>

                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                              }}
                            >
                              {item.front_signed_url && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openDocument(item.front_signed_url)
                                  }
                                  style={{
                                    border: "none",
                                    background: "#2563eb",
                                    color: "#ffffff",
                                    padding: "10px 15px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                  }}
                                >
                                  Open Front
                                </button>
                              )}

                              {item.back_signed_url && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openDocument(item.back_signed_url)
                                  }
                                  style={{
                                    border: "none",
                                    background: "#475569",
                                    color: "#ffffff",
                                    padding: "10px 15px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                  }}
                                >
                                  Open Back
                                </button>
                              )}

                              {!item.front_signed_url &&
                                !item.back_signed_url && (
                                  <span
                                    style={{
                                      color: "#777",
                                    }}
                                  >
                                    No documents uploaded.
                                  </span>
                                )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
