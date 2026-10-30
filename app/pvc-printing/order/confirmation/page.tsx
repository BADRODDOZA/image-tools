"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PVCOrderConfirmationPage() {
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#f4f6f9",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "650px",
          background: "#ffffff",
          padding: "40px",
          borderRadius: "18px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            margin: "0 auto 20px",
            borderRadius: "50%",
            background: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "42px",
          }}
        >
          ✓
        </div>

        <h1
          style={{
            fontSize: "32px",
            color: "#166534",
            marginBottom: "12px",
          }}
        >
          Order Submitted Successfully!
        </h1>

        <p
          style={{
            color: "#4b5563",
            fontSize: "16px",
            lineHeight: 1.6,
            marginBottom: "25px",
          }}
        >
          Thank you. Your PVC printing order has been received
          successfully.
        </p>

        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "25px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#6b7280",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            YOUR ORDER ID
          </p>

          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#111827",
              wordBreak: "break-all",
            }}
          >
            {orderId || "Order ID unavailable"}
          </div>
        </div>

        <div
          style={{
            background: "#eff6ff",
            borderRadius: "12px",
            padding: "18px",
            marginBottom: "25px",
            color: "#1e40af",
          }}
        >
          <strong>Current Status: Pending</strong>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Your order has been received and is waiting for
            further processing.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexDirection: "column",
          }}
        >
          <Link
            href="/pvc-printing"
            style={{
              display: "block",
              padding: "14px",
              background: "#2563eb",
              color: "#ffffff",
              textDecoration: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "700",
            }}
          >
            Back to PVC Printing
          </Link>

          <Link
            href="/"
            style={{
              display: "block",
              padding: "14px",
              background: "#f3f4f6",
              color: "#374151",
              textDecoration: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            Back to Home
          </Link>
        </div>

        <p
          style={{
            marginTop: "25px",
            marginBottom: 0,
            color: "#6b7280",
            fontSize: "13px",
          }}
        >
          🇮🇳 PVC orders are currently available within India only.
        </p>
      </div>
    </main>
  );
}

