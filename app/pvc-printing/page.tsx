"use client";

import { useState } from "react";

export default function PVCPrintingPage() {
  const [accepted, setAccepted] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#f4f6f9",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "white",
          borderRadius: "18px",
          padding: "35px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: "35px" }}>
          <div style={{ fontSize: "55px", marginBottom: "10px" }}>🪪</div>

          <h1
            style={{
              margin: 0,
              fontSize: "34px",
              color: "#111827",
            }}
          >
            PVC Document Printing Service
          </h1>

          <p
            style={{
              marginTop: "12px",
              fontSize: "18px",
              color: "#6b7280",
            }}
          >
            Have a genuine document and want a durable PVC print?
          </p>
        </div>

        {/* SERVICE DESCRIPTION */}
        <section
          style={{
            padding: "22px",
            background: "#eff6ff",
            borderRadius: "14px",
            marginBottom: "25px",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#1d4ed8" }}>
            What is this service?
          </h2>

          <p
            style={{
              color: "#374151",
              lineHeight: 1.7,
              marginBottom: 0,
            }}
          >
            We provide a customer-requested PVC printing service for eligible
            documents and cards supplied by the customer. We print the
            customer-provided content onto PVC material without changing the
            information supplied.
          </p>
        </section>

        {/* WHAT WE DO */}
        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ color: "#111827" }}>What we do</h2>

          <ul
            style={{
              lineHeight: 2,
              color: "#374151",
              paddingLeft: "25px",
            }}
          >
            <li>Print customer-provided content onto PVC material.</li>
            <li>Print the document as supplied by the customer.</li>
            <li>Provide the finished PVC print to the customer.</li>
          </ul>
        </section>

        {/* WHAT WE DON'T DO */}
        <section
          style={{
            marginBottom: "28px",
            padding: "22px",
            background: "#fff7ed",
            borderRadius: "14px",
            border: "1px solid #fed7aa",
          }}
        >
          <h2 style={{ color: "#c2410c", marginTop: 0 }}>
            What we do NOT do
          </h2>

          <ul
            style={{
              lineHeight: 2,
              color: "#374151",
              paddingLeft: "25px",
            }}
          >
            <li>We do not issue government documents.</li>

            <li>
              We do not create, forge, alter, edit, manipulate, or authenticate
              government documents.
            </li>

            <li>
              We do not change names, photographs, numbers, dates, QR codes,
              signatures, or other document information.
            </li>

            <li>
              We do not represent ourselves as a government department or
              official document issuing authority.
            </li>

            <li>
              We do not provide a replacement for an officially issued
              government card.
            </li>
          </ul>
        </section>

        {/* CUSTOMER DECLARATION */}
        <section style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#111827" }}>Customer Declaration</h2>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "20px",
              background: "#fafafa",
            }}
          >
            <p style={{ lineHeight: 1.7, color: "#374151" }}>
              By placing an order, the customer confirms that:
            </p>

            <ol
              style={{
                lineHeight: 2,
                color: "#374151",
                paddingLeft: "25px",
              }}
            >
              <li>
                The document/content submitted belongs to them or they are
                authorized to submit it.
              </li>

              <li>
                The document supplied is genuine and has not been fraudulently
                created or altered.
              </li>

              <li>
                They have checked that PVC printing of the particular document
                through a third-party printing service is permitted.
              </li>

              <li>
                They are responsible for the lawful use of the finished PVC
                print.
              </li>

              <li>
                They understand that our service is printing only and does not
                make the PVC print an officially issued government card.
              </li>
            </ol>
          </div>
        </section>

        {/* ACCEPTANCE */}
        <section
          style={{
            padding: "20px",
            background: "#f9fafb",
            borderRadius: "12px",
            marginBottom: "25px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              cursor: "pointer",
              color: "#374151",
              lineHeight: 1.6,
            }}
          >
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              style={{
                width: "20px",
                height: "20px",
                marginTop: "3px",
              }}
            />

            <span>
              I confirm that I have read and understood the above information
              and that I am authorized to submit the document for printing.
            </span>
          </label>
        </section>

        {/* ORDER BUTTON */}
        <button
          disabled={!accepted}
          onClick={() => {
            window.location.href = "/pvc-printing/order";
          }}
          style={{
            width: "100%",
            padding: "16px",
            border: "none",
            borderRadius: "10px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: accepted ? "pointer" : "not-allowed",
            background: accepted ? "#2563eb" : "#9ca3af",
            color: "white",
            transition: "0.2s",
          }}
        >
          Continue to PVC Card Order →
        </button>

        {/* NOTICE */}
        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "13px",
            color: "#6b7280",
            lineHeight: 1.6,
          }}
        >
          We reserve the right to refuse an order where the requested printing
          may be unlawful, misleading, unauthorized, or contrary to the rules
          of the relevant issuing authority.
        </p>
      </div>
    </main>
  );
}