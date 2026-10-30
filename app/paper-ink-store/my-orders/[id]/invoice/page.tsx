"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  product_id: string | null;
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

export default function InvoicePage() {
  const params = useParams();

  const rawId = params.id;

  const orderId =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId)
      ? rawId[0]
      : "";

  const [order, setOrder] =
    useState<StoreOrder | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    try {
      setLoading(true);
      setError("");

      const cleanOrderId = orderId
        .trim()
        .replace(/^#/, "");

      console.log(
        "================================="
      );

      console.log(
        "INVOICE PAGE LOADING ORDER:"
      );

      console.log(
        cleanOrderId
      );

      console.log(
        "================================="
      );

      const response = await fetch(
        `/api/store-order/${encodeURIComponent(
          cleanOrderId
        )}?invoice=true`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      console.log(
        "Invoice HTTP status:",
        response.status
      );

      const data =
        await response.json();

      console.log(
        "INVOICE API FULL RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `API returned status ${response.status}`
        );
      }

      /*
       * Accept several possible response
       * structures so the Invoice page
       * cannot fail just because the API
       * wrapper is different.
       */

      let receivedOrder: any = null;

      if (data?.order) {
        receivedOrder = data.order;
      } else if (data?.data?.order) {
        receivedOrder =
          data.data.order;
      } else if (data?.data?.id) {
        receivedOrder = data.data;
      } else if (data?.id) {
        receivedOrder = data;
      }

      console.log(
        "INVOICE ORDER FOUND:",
        receivedOrder
      );

      if (!receivedOrder) {
        throw new Error(
          data?.error ||
            "The API responded, but no order data was returned."
        );
      }

      const normalizedOrder: StoreOrder =
        {
          id:
            receivedOrder.id,

          customer_name:
            receivedOrder.customer_name ||
            "",

          mobile:
            receivedOrder.mobile ||
            "",

          address:
            receivedOrder.address ||
            "",

          landmark:
            receivedOrder.landmark ??
            null,

          city:
            receivedOrder.city ||
            "",

          state:
            receivedOrder.state ||
            "",

          pin_code:
            receivedOrder.pin_code ||
            "",

          total_amount:
            Number(
              receivedOrder.total_amount
            ) || 0,

          status:
            receivedOrder.status ||
            "Pending",

          payment_status:
            receivedOrder.payment_status ||
            "Pending",

          created_at:
            receivedOrder.created_at,

          items:
            Array.isArray(
              receivedOrder.items
            )
              ? receivedOrder.items.map(
                  (item: any) => ({
                    id:
                      item.id,

                    product_id:
                      item.product_id ??
                      null,

                    product_name:
                      item.product_name ||
                      "",

                    quantity:
                      Number(
                        item.quantity
                      ) || 0,

                    price:
                      Number(
                        item.price
                      ) || 0,

                    total:
                      Number(
                        item.total
                      ) || 0,
                  })
                )
              : [],
        };

      setOrder(
        normalizedOrder
      );
    } catch (err) {
      console.error(
        "INVOICE LOADING ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  function money(value: number) {
    return `₹${Number(value).toFixed(2)}`;
  }

  function formatDate(
    dateString: string
  ) {
    if (!dateString) {
      return "-";
    }

    return new Date(
      dateString
    ).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function printInvoice() {
    window.print();
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          <div className="loading-icon">
            🧾
          </div>

          <h2>
            Loading Invoice...
          </h2>

          <p>
            Please wait.
          </p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="page">
        <div className="error-card">
          <div className="error-icon">
            ⚠️
          </div>

          <h1>
            Invoice Not Found
          </h1>

          <p>
            {error ||
              "Unable to load invoice."}
          </p>

          <div className="error-actions">
            <Link href="/paper-ink-store/my-orders">
              My Orders
            </Link>

            <Link href="/paper-ink-store">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="page">
        <div className="invoice">

          {/* HEADER */}

          <div className="invoice-header">
            <div>
              <h1>
                🖼️ Image Tools
              </h1>

              <p>
                A4 Paper & Printer Ink Store
              </p>
            </div>

            <div className="invoice-heading">
              <h2>
                INVOICE
              </h2>

              <p>
                #{order.id}
              </p>
            </div>
          </div>

          <div className="divider" />

          {/* ORDER INFORMATION */}

          <div className="order-info">
            <div>
              <span>
                Order ID
              </span>

              <strong>
                #{order.id}
              </strong>
            </div>

            <div>
              <span>
                Order Date
              </span>

              <strong>
                {formatDate(
                  order.created_at
                )}
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>

              <strong>
                {order.status}
              </strong>
            </div>

            <div>
              <span>
                Payment
              </span>

              <strong>
                {order.payment_status}
              </strong>
            </div>
          </div>

          <div className="divider" />

          {/* CUSTOMER */}

          <div className="customer-section">

            <div className="customer-box">
              <h3>
                Customer Details
              </h3>

              <p>
                <strong>
                  {order.customer_name}
                </strong>
              </p>

              <p>
                Mobile:{" "}
                {order.mobile}
              </p>
            </div>

            <div className="customer-box">
              <h3>
                Delivery Address
              </h3>

              <p>
                {order.address}
              </p>

              {order.landmark && (
                <p>
                  Landmark:{" "}
                  {order.landmark}
                </p>
              )}

              <p>
                {order.city},{" "}
                {order.state}
              </p>

              <p>
                PIN:{" "}
                {order.pin_code}
              </p>
            </div>

          </div>

          {/* PRODUCTS */}

          <div className="products-section">

            <h3>
              Ordered Products
            </h3>

            {order.items.length ===
            0 ? (
              <div className="no-items">
                No products found
                for this order.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>
                      #
                    </th>

                    <th>
                      Product
                    </th>

                    <th className="center">
                      Qty
                    </th>

                    <th className="right">
                      Price
                    </th>

                    <th className="right">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {order.items.map(
                    (
                      item,
                      index
                    ) => (
                      <tr
                        key={
                          item.id
                        }
                      >
                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {
                            item.product_name
                          }
                        </td>

                        <td className="center">
                          {
                            item.quantity
                          }
                        </td>

                        <td className="right">
                          {money(
                            item.price
                          )}
                        </td>

                        <td className="right">
                          {money(
                            item.total
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}

          </div>

          {/* TOTAL */}

          <div className="total-section">
            <div className="total-row">
              <span>
                Grand Total
              </span>

              <strong>
                {money(
                  order.total_amount
                )}
              </strong>
            </div>
          </div>

          {/* FOOTER */}

          <div className="invoice-footer">
            <p>
              Thank you for your order!
            </p>

            <p>
              Please keep this invoice
              for your records.
            </p>
          </div>

          {/* BUTTONS */}

          <div className="actions no-print">

            <button
              type="button"
              onClick={
                printInvoice
              }
            >
              🖨️ Print Invoice
            </button>

            <Link
              href={`/paper-ink-store/my-orders/${order.id}`}
            >
              ← Order Details
            </Link>

            <Link
              href="/paper-ink-store/my-orders"
            >
              My Orders
            </Link>

          </div>

        </div>
      </main>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f2f4f7;
          padding: 30px 15px 60px;
          box-sizing: border-box;
        }

        .invoice {
          width: 100%;
          max-width: 850px;
          margin: 0 auto;
          padding: 45px;
          background: #ffffff;
          box-sizing: border-box;
          box-shadow:
            0 8px 30px
            rgba(0, 0, 0, 0.08);
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          gap: 30px;
        }

        .invoice-header h1 {
          margin: 0 0 5px;
          color: #172033;
          font-size: 24px;
        }

        .invoice-header p {
          margin: 0;
          color: #667085;
          font-size: 13px;
        }

        .invoice-heading {
          text-align: right;
        }

        .invoice-heading h2 {
          margin: 0 0 5px;
          color: #155eef;
          font-size: 26px;
        }

        .invoice-heading p {
          word-break: break-all;
        }

        .divider {
          height: 1px;
          margin: 25px 0;
          background: #d0d5dd;
        }

        .order-info {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 20px;
        }

        .order-info div {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .order-info span {
          color: #667085;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .order-info strong {
          color: #172033;
          font-size: 13px;
        }

        .customer-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
        }

        .customer-box {
          padding: 18px;
          border: 1px solid #eaecf0;
          border-radius: 10px;
        }

        .customer-box h3 {
          margin: 0 0 12px;
          color: #172033;
          font-size: 14px;
        }

        .customer-box p {
          margin: 5px 0;
          color: #475467;
          font-size: 13px;
          line-height: 1.5;
        }

        .products-section {
          margin-top: 30px;
        }

        .products-section h3 {
          margin: 0 0 15px;
          color: #172033;
          font-size: 16px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          padding: 12px 10px;
          background: #f2f4f7;
          color: #344054;
          text-align: left;
          font-size: 12px;
          border-bottom: 1px solid #d0d5dd;
        }

        td {
          padding: 13px 10px;
          color: #475467;
          font-size: 13px;
          border-bottom: 1px solid #eaecf0;
        }

        .center {
          text-align: center;
        }

        .right {
          text-align: right;
        }

        .no-items {
          padding: 20px;
          text-align: center;
          color: #667085;
          background: #f9fafb;
          border-radius: 8px;
        }

        .total-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 25px;
        }

        .total-row {
          width: 300px;
          display: flex;
          justify-content: space-between;
          padding: 16px 0;
          border-top: 2px solid #172033;
          border-bottom: 2px solid #172033;
        }

        .total-row span {
          color: #344054;
          font-weight: 700;
        }

        .total-row strong {
          color: #172033;
          font-size: 21px;
        }

        .invoice-footer {
          margin-top: 40px;
          text-align: center;
          color: #667085;
          font-size: 12px;
        }

        .invoice-footer p {
          margin: 5px 0;
        }

        .actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 30px;
        }

        .actions button,
        .actions a {
          min-height: 42px;
          padding: 0 16px;
          border: none;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-sizing: border-box;
        }

        .actions button {
          background: #155eef;
          color: #ffffff;
        }

        .actions a {
          background: #eef4ff;
          color: #155eef;
        }

        .loading {
          width: 100%;
          max-width: 500px;
          margin: 100px auto;
          padding: 40px;
          background: #ffffff;
          border-radius: 15px;
          text-align: center;
          box-sizing: border-box;
        }

        .loading-icon {
          font-size: 45px;
        }

        .loading h2 {
          color: #172033;
        }

        .loading p {
          color: #667085;
        }

        .error-card {
          width: 100%;
          max-width: 500px;
          margin: 80px auto;
          padding: 35px;
          background: #ffffff;
          border-radius: 16px;
          text-align: center;
          box-shadow:
            0 8px 30px
            rgba(0, 0, 0, 0.06);
          box-sizing: border-box;
        }

        .error-icon {
          font-size: 50px;
        }

        .error-card h1 {
          color: #172033;
        }

        .error-card p {
          color: #667085;
          line-height: 1.5;
          word-break: break-word;
        }

        .error-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }

        .error-actions a {
          padding: 11px 15px;
          border-radius: 9px;
          background: #155eef;
          color: #ffffff;
          text-decoration: none;
          font-weight: 700;
          font-size: 13px;
        }

        @media (max-width: 700px) {
          .page {
            padding: 10px;
          }

          .invoice {
            padding: 22px 15px;
          }

          .invoice-header {
            flex-direction: column;
          }

          .invoice-heading {
            text-align: left;
          }

          .order-info {
            grid-template-columns: 1fr 1fr;
          }

          .customer-section {
            grid-template-columns: 1fr;
          }

          .products-section {
            overflow-x: auto;
          }

          table {
            min-width: 600px;
          }

          .total-row {
            width: 100%;
          }

          .actions {
            flex-direction: column;
          }

          .actions a,
          .actions button {
            width: 100%;
          }
        }

        @media print {
          .page {
            padding: 0;
            background: #ffffff;
          }

          .invoice {
            max-width: none;
            padding: 0;
            box-shadow: none;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}