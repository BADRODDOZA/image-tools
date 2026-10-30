
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type OrderItem = {
  id?: string;
  product_id?: string;
  product_name?: string;
  name?: string;
  quantity: number;
  price: number;
  total?: number;
};

type StoreOrder = {
  id: string;
  customer_name?: string;
  mobile?: string;
  address?: string;
  landmark?: string | null;
  city?: string;
  state?: string;
  pin_code?: string;
  total_amount: number;
  status?: string;
  payment_status?: string;
  payment_id?: string | null;
  created_at?: string;
  items: OrderItem[];
};

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = String(params.id || "");

  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrder() {
    try {
      setLoading(true);
      setError("");

      const cleanOrderId = orderId.trim().replace(/^#/, "");

      if (!cleanOrderId) {
        throw new Error("Order ID is missing.");
      }

      const response = await fetch(
        `/api/store-order/${encodeURIComponent(cleanOrderId)}?details=true`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load order.");
      }

      let receivedOrder: any = null;

      if (data?.order) {
        receivedOrder = data.order;
      } else if (data?.data?.order) {
        receivedOrder = data.data.order;
      } else if (data?.data?.id) {
        receivedOrder = data.data;
      } else if (data?.id) {
        receivedOrder = data;
      }

      if (!receivedOrder) {
        throw new Error(data?.error || "Order data was not returned.");
      }

      setOrder({
        ...receivedOrder,
        total_amount: Number(receivedOrder.total_amount) || 0,
        items: Array.isArray(receivedOrder.items)
          ? receivedOrder.items
          : [],
      });
    } catch (err) {
      console.error("Order loading error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load order."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-center shadow">
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-center shadow">
          <h1 className="mb-3 text-2xl font-bold text-red-600">
            Order Not Found
          </h1>

          <p className="mb-6 text-gray-600">
            {error || "Unable to find this order."}
          </p>

          <button
            onClick={loadOrder}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            Try Again
          </button>

          <div className="mt-4">
            <Link
              href="/paper-ink-store/my-orders"
              className="text-blue-600 underline"
            >
              Back to My Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const fullAddress = [
    order.address,
    order.landmark,
    order.city,
    order.state,
    order.pin_code,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order Details
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Order ID: {order.id}
            </p>
          </div>

          <Link
            href="/paper-ink-store/my-orders"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Back to My Orders
          </Link>
        </div>

        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Order Status
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Order Status</p>
              <p className="mt-1 font-semibold text-gray-900">
                {order.status || "Pending"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <p className="mt-1 font-semibold text-gray-900">
                {order.payment_status || "Pending"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="mt-1 font-medium text-gray-900">
                {order.created_at
                  ? new Date(order.created_at).toLocaleString("en-IN")
                  : "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="mt-1 text-xl font-bold text-green-700">
                ₹{order.total_amount.toFixed(2)}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Customer Details
          </h2>

          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Name:</strong>{" "}
              {order.customer_name || "Not available"}
            </p>

            <p>
              <strong>Mobile:</strong>{" "}
              {order.mobile || "Not available"}
            </p>

            <p>
              <strong>Delivery Address:</strong>{" "}
              {fullAddress || "Not available"}
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Ordered Products
          </h2>

          {order.items.length === 0 ? (
            <p className="text-sm text-gray-500">
              No product details available.
            </p>
          ) : (
            <div className="space-y-4">
              {order.items.map((item, index) => {
                const itemName =
                  item.product_name || item.name || "Product";

                const itemTotal =
                  Number(item.total) ||
                  Number(item.price) * Number(item.quantity);

                return (
                  <div
                    key={item.id || `${item.product_id || itemName}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {itemName}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>

                      <p className="text-sm text-gray-500">
                        Price: ₹{Number(item.price || 0).toFixed(2)}
                      </p>
                    </div>

                    <p className="font-bold text-gray-900">
                      ₹{itemTotal.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex justify-between border-t pt-4">
            <span className="font-bold text-gray-900">
              Total Amount
            </span>

            <span className="text-xl font-bold text-green-700">
              ₹{order.total_amount.toFixed(2)}
            </span>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/paper-ink-store/my-orders/${encodeURIComponent(order.id)}/invoice`}
            className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
          >
            View Invoice
          </Link>

          <Link
            href="/paper-ink-store/my-orders"
            className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-100"
          >
            My Orders
          </Link>
        </div>

      </div>
    </main>
  );
}
