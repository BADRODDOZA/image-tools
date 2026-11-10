
"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Order = {
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
  razorpay_payment_id: string | null;
  created_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
};

type OrderResponse = {
  success: boolean;
  order?: Order;
  items?: OrderItem[];
  error?: string;
};

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    fetchOrder(orderId);
  }, [orderId]);

  async function fetchOrder(id: string) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/store-orders/${encodeURIComponent(id)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      let result: OrderResponse;

      try {
        result = await response.json();
      } catch {
        setError("The server returned an invalid response.");
        setLoading(false);
        return;
      }

      if (!response.ok || !result.success) {
        setError(result.error || "Could not load your order.");
        setLoading(false);
        return;
      }

      if (!result.order) {
        setError("Order information was not found.");
        setLoading(false);
        return;
      }

      setOrder(result.order);
      setItems(result.items || []);

      // Clear cart only after order loads successfully.
      localStorage.removeItem("paperInkCart");

      window.dispatchEvent(new Event("paperInkCartUpdated"));

      setLoading(false);
    } catch (err) {
      console.error("Order confirmation error:", err);
      setError("Something went wrong while loading your order.");
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    try {
      return new Date(dateString).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return dateString;
    }
  }

  function getPaymentStatus() {
    if (!order) return "Pending";

    if (order.payment_status?.toLowerCase() === "paid") {
      return "Paid";
    }

    if (order.razorpay_payment_id) {
      return "Paid";
    }

    return order.payment_status || "Pending";
  }

  function getPaymentColor() {
    const status = getPaymentStatus().toLowerCase();

    if (status === "paid") return "#166534";
    if (status === "failed") return "#b91c1c";

    return "#92400e";
  }

  function getPaymentBackground() {
    const status = getPaymentStatus().toLowerCase();

    if (status === "paid") return "#dcfce7";
    if (status === "failed") return "#fee2e2";

    return "#fef3c7";
  }

  function getOrderStatusColor() {
    if (!order) return "#92400e";

    const status = order.status.toLowerCase();

    if (status === "completed") return "#166534";
    if (status === "shipped") return "#1d4ed8";
    if (status === "cancelled" || status === "rejected") {
      return "#b91c1c";
    }

    return "#92400e";
  }

  function getOrderStatusBackground() {
    if (!order) return "#fef3c7";

    const status = order.status.toLowerCase();

    if (status === "completed") return "#dcfce7";
    if (status === "shipped") return "#dbeafe";
    if (status === "cancelled" || status === "rejected") {
      return "#fee2e2";
    }

    return "#fef3c7";
  }

  if (loading) {
    return (
      <main className="confirmation-page">
        <div className="confirmation-card loading-card">
          <div className="loading-icon">⏳</div>
          <h1>Loading your order...</h1>
          <p>Please wait while we retrieve your order details.</p>
        </div>

        <style jsx>{`
          .confirmation-page {
            min-height: 100vh;
            background: linear-gradient(135deg, #eef4ff, #f8fbff);
            padding: 50px 20px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }

          .confirmation-card {
            width: 100%;
            max-width: 700px;
            background: white;
            border-radius: 18px;
            padding: 45px 25px;
            text-align: center;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          }

          .loading-icon {
            font-size: 55px;
            margin-bottom: 15px;
          }

          h1 {
            color: #1e3a8a;
            margin: 0 0 10px;
          }

          p {
            color: #666;
            margin: 0;
            line-height: 1.6;
          }

          @media (max-width: 480px) {
            .confirmation-page {
              padding: 25px 12px;
            }

            .confirmation-card {
              padding: 35px 18px;
            }
          }
        `}</style>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="confirmation-page">
        <div className="confirmation-card error-card">
          <div className="error-icon">❌</div>
          <h1>Order Not Found</h1>
          <p>{error || "We could not find this order."}</p>

          <div className="button-row">
            <Link href="/paper-ink-store" className="primary-button">
              🛒 Shop Now
            </Link>

            <Link href="/" className="secondary-button">
              🏠 Home
            </Link>
          </div>
        </div>

        <style jsx>{`
          .confirmation-page {
            min-height: 100vh;
            background: linear-gradient(135deg, #eef4ff, #f8fbff);
            padding: 50px 20px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }

          .confirmation-card {
            width: 100%;
            max-width: 700px;
            background: white;
            border-radius: 18px;
            padding: 45px 25px;
            text-align: center;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          }

          .error-icon {
            font-size: 60px;
            margin-bottom: 15px;
          }

          h1 {
            color: #991b1b;
            margin: 0 0 12px;
          }

          p {
            color: #666;
            line-height: 1.6;
          }

          .button-row {
            display: flex;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 25px;
          }

          .primary-button,
          .secondary-button {
            display: inline-block;
            padding: 12px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
          }

          .primary-button {
            background: #2563eb;
            color: white;
          }

          .secondary-button {
            background: #e5e7eb;
            color: #111827;
          }

          @media (max-width: 480px) {
            .confirmation-page {
              padding: 25px 12px;
            }

            .confirmation-card {
              padding: 35px 18px;
            }

            .button-row {
              flex-direction: column;
            }

            .primary-button,
            .secondary-button {
              width: 100%;
              box-sizing: border-box;
            }
          }
        `}</style>
      </main>
    );
  }

  const paymentStatus = getPaymentStatus();

  return (
    <main className="confirmation-page">
      <div className="confirmation-container">
        <section className="success-card">
          <div className="success-icon">✓</div>

          <h1>Order Confirmed!</h1>

          <p className="success-message">
            Thank you for your order. Your A4 paper and printer ink
            order has been received.
          </p>

          <div className="order-id-box">
            <span>Order ID</span>
            <strong>{order.id}</strong>
          </div>

          <p className="order-date">
            Ordered on {formatDate(order.created_at)}
          </p>
        </section>

        <section className="status-grid">
          <div className="info-card">
            <h2>💳 Payment</h2>

            <div
              className="status-badge"
              style={{
                background: getPaymentBackground(),
                color: getPaymentColor(),
              }}
            >
              {paymentStatus}
            </div>

            {order.razorpay_payment_id && (
              <div className="small-info">
                <span>Payment ID</span>
                <strong>{order.razorpay_payment_id}</strong>
              </div>
            )}
          </div>

          <div className="info-card">
            <h2>📦 Order Status</h2>

            <div
              className="status-badge"
              style={{
                background: getOrderStatusBackground(),
                color: getOrderStatusColor(),
              }}
            >
              {order.status || "Pending"}
            </div>
          </div>
        </section>

        <section className="content-card">
          <h2>👤 Customer Details</h2>

          <div className="details-grid">
            <div>
              <span>Full Name</span>
              <strong>{order.customer_name}</strong>
            </div>

            <div>
              <span>Mobile</span>
              <strong>{order.mobile}</strong>
            </div>
          </div>
        </section>

        <section className="content-card">
          <h2>🚚 Delivery Address</h2>

          <div className="address-box">
            <strong>{order.customer_name}</strong>
            <p>{order.address}</p>

            {order.landmark && (
              <p>
                <strong>Landmark:</strong> {order.landmark}
              </p>
            )}

            <p>
              {order.city}, {order.state}
            </p>

            <p>PIN Code: {order.pin_code}</p>
            <p>Mobile: {order.mobile}</p>
          </div>
        </section>

        <section className="content-card">
          <h2>🛒 Ordered Items</h2>

          {items.length === 0 ? (
            <p className="empty-items">
              No item details were found for this order.
            </p>
          ) : (
            <div className="items-list">
              {items.map((item, index) => (
                <div
                  key={item.id || `${item.product_id}-${index}`}
                  className="order-item"
                >
                  <div className="item-number">{index + 1}</div>

                  <div className="item-details">
                    <strong>{item.product_name}</strong>
                    <span>Quantity: {item.quantity}</span>
                    <span>Price: ₹{Number(item.price).toFixed(2)}</span>
                  </div>

                  <div className="item-total">
                    ₹{Number(item.total).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grand-total">
            <span>Total Amount</span>
            <strong>₹{Number(order.total_amount).toFixed(2)}</strong>
          </div>
        </section>

        <section className="notice-card">
          <div className="notice-icon">📋</div>

          <div>
            <h3>What happens next?</h3>

            <p>
              Your order will be reviewed and processed. You can use
              the order tracking option to check the latest status of
              your order.
            </p>
          </div>
        </section>

        <div className="button-row">
          <Link href="/paper-ink-store" className="primary-button">
            🛒 Shop More
          </Link>

          <Link
            href={`/track-order?orderId=${encodeURIComponent(order.id)}`}
            className="tracking-button"
          >
            📦 Track Order
          </Link>

          <Link href="/" className="secondary-button">
            🏠 Home
          </Link>
        </div>
      </div>

      <style jsx>{`
        .confirmation-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #eef4ff, #f8fbff);
          padding: 40px 20px 70px;
        }

        .confirmation-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .success-card {
          background: white;
          border-radius: 18px;
          padding: 35px 25px;
          text-align: center;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          margin-bottom: 20px;
        }

        .success-icon {
          width: 75px;
          height: 75px;
          border-radius: 50%;
          background: #dcfce7;
          color: #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          font-size: 45px;
          font-weight: bold;
        }

        .success-card h1 {
          color: #166534;
          margin: 0 0 10px;
          font-size: 32px;
        }

        .success-message {
          color: #555;
          line-height: 1.6;
          margin: 0 auto 20px;
          max-width: 650px;
        }

        .order-id-box {
          display: flex;
          flex-direction: column;
          gap: 5px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 15px;
          max-width: 650px;
          margin: 0 auto;
        }

        .order-id-box span {
          font-size: 13px;
          color: #64748b;
        }

        .order-id-box strong {
          color: #1e3a8a;
          word-break: break-all;
          font-size: 14px;
        }

        .order-date {
          color: #777;
          font-size: 14px;
          margin: 15px 0 0;
        }

        .status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .info-card,
        .content-card {
          background: white;
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.07);
          margin-bottom: 20px;
        }

        .status-grid .info-card {
          margin-bottom: 0;
        }

        .info-card h2,
        .content-card h2 {
          color: #1e3a8a;
          margin: 0 0 18px;
          font-size: 20px;
        }

        .status-badge {
          display: inline-block;
          padding: 9px 16px;
          border-radius: 999px;
          font-weight: bold;
          font-size: 14px;
        }

        .small-info {
          margin-top: 15px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .small-info span {
          font-size: 12px;
          color: #777;
        }

        .small-info strong {
          font-size: 12px;
          word-break: break-all;
          color: #374151;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .details-grid div {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .details-grid span {
          color: #777;
          font-size: 13px;
        }

        .details-grid strong {
          color: #222;
          word-break: break-word;
        }

        .address-box {
          background: #f8fafc;
          border-radius: 10px;
          padding: 18px;
          line-height: 1.7;
          color: #374151;
        }

        .address-box p {
          margin: 4px 0;
        }

        .items-list {
          display: grid;
          gap: 12px;
        }

        .order-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
        }

        .item-number {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }

        .item-details {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-details strong {
          color: #111827;
        }

        .item-details span {
          color: #777;
          font-size: 13px;
        }

        .item-total {
          font-weight: bold;
          color: #166534;
          white-space: nowrap;
        }

        .grand-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 2px solid #ddd;
          font-size: 22px;
        }

        .grand-total strong {
          color: #16a34a;
        }

        .empty-items {
          color: #777;
        }

        .notice-card {
          display: flex;
          gap: 15px;
          align-items: flex-start;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .notice-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .notice-card h3 {
          color: #1e3a8a;
          margin: 0 0 6px;
        }

        .notice-card p {
          color: #4b5563;
          margin: 0;
          line-height: 1.6;
        }

        .button-row {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .primary-button,
        .tracking-button,
        .secondary-button {
          display: inline-block;
          padding: 13px 20px;
          border-radius: 9px;
          text-decoration: none;
          font-weight: bold;
          text-align: center;
        }

        .primary-button {
          background: #2563eb;
          color: white;
        }

        .tracking-button {
          background: #16a34a;
          color: white;
        }

        .secondary-button {
          background: #e5e7eb;
          color: #111827;
        }

        @media (max-width: 700px) {
          .status-grid,
          .details-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .confirmation-page {
            padding: 25px 12px 50px;
          }

          .success-card,
          .info-card,
          .content-card {
            padding: 20px 16px;
          }

          .success-card h1 {
            font-size: 27px;
          }

          .success-icon {
            width: 65px;
            height: 65px;
            font-size: 38px;
          }

          .order-item {
            align-items: flex-start;
          }

          .item-total {
            font-size: 14px;
          }

          .grand-total {
            font-size: 19px;
          }

          .notice-card {
            padding: 16px;
          }

          .button-row {
            flex-direction: column;
          }

          .primary-button,
          .tracking-button,
          .secondary-button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#eef4ff",
            color: "#1e3a8a",
            fontSize: "20px",
          }}
        >
          Loading order confirmation...
        </main>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
