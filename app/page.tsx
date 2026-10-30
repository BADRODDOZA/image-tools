"use client";

import { useState } from "react";
import Link from "next/link";
import Hero from "./components/Hero";
import WhyChooseUs from "./components/WhyChooseUs";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";

const tools = [
  {
    icon: "📏",
    name: "Resize Image",
    link: "/resize",
    color: "#3b82f6",
  },
  {
    icon: "🖼️",
    name: "JPG to PNG",
    link: "/jpg-to-png",
    color: "#10b981",
  },
  {
    icon: "📸",
    name: "PNG to JPG",
    link: "/png-to-jpg",
    color: "#f59e0b",
  },
  {
    icon: "🗜️",
    name: "Compress Image",
    link: "/compress",
    color: "#ef4444",
  },
  {
    icon: "✂️",
    name: "Crop Image",
    link: "/crop",
    color: "#8b5cf6",
  },
  {
    icon: "🌐",
    name: "JPG to WebP",
    link: "/jpg-to-webp",
    color: "#6366f1",
  },
  {
    icon: "🖼️",
    name: "WebP to JPG",
    link: "/webp-to-jpg",
    color: "#06b6d4",
  },
  {
    icon: "🔄",
    name: "Flip Image",
    link: "/flip",
    color: "#14b8a6",
  },
  {
    icon: "📄",
    name: "JPG to PDF",
    link: "/jpg-to-pdf",
    color: "#dc2626",
  },
  {
    icon: "📄",
    name: "PNG to PDF",
    link: "/png-to-pdf",
    color: "#16a34a",
  },
  {
    icon: "📄",
    name: "PDF to JPG",
    link: "/pdf-to-jpg",
    color: "#7c3aed",
  },
  {
    icon: "🖼️",
    name: "PDF to PNG",
    link: "/pdf-to-png",
    color: "#16a34a",
  },
  {
    icon: "📄",
    name: "Image to PDF",
    description:
      "Convert images to PDF, resize dimensions, choose page settings, and control PDF size in KB.",
    link: "/image-to-pdf",
    color: "#dc2626",
  },
  {
    icon: "🔍",
    name: "Image Information",
    link: "/image-info",
    color: "#0891b2",
  },
  {
    icon: "🌐",
    name: "Image to WebP",
    link: "/image-to-webp",
    color: "#0f766e",
  },
  {
    icon: "💧",
    name: "Add Watermark",
    link: "/add-watermark",
    color: "#0891b2",
  },
  {
    icon: "🖼️",
    name: "WebP to PNG",
    link: "/webp-to-png",
    color: "#8b5cf6",
  },
  {
    icon: "📐",
    name: "Resize by Pixels",
    link: "/resize-by-pixels",
    color: "#6366f1",
  },
  {
    icon: "📊",
    name: "Resize by Percentage",
    link: "/resize-by-percentage",
    color: "#ec4899",
  },
  {
    icon: "🖼️",
    name: "Image to JPG / JPEG",
    description:
      "Convert images to JPG/JPEG, resize dimensions, and control file size in KB.",
    link: "/image-to-jpg",
    color: "#0ea5e9",
  },
  {
    icon: "✂️",
    name: "Remove Background",
    description:
      "Automatically remove the background from your image and download a transparent PNG.",
    link: "/remove-background",
    color: "#7c3aed",
  },
];

export default function Home() {
  const [search, setSearch] = useState("");

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main
      style={{
        width: "100%",
        background:
          "linear-gradient(180deg, #f8fbff 0%, #ffffff 45%, #f8fbff 100%)",
        color: "#111827",
        overflow: "hidden",
      }}
    >
      {/* HERO */}
      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "30px 20px 10px",
        }}
      >
        <Hero />
      </section>

      {/* MAIN INTRO */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "20px 20px 40px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 15px",
            borderRadius: "999px",
            background: "#eff6ff",
            color: "#2563eb",
            fontSize: "14px",
            fontWeight: "700",
            marginBottom: "14px",
          }}
        >
          ✨ Simple • Fast • Free
        </div>

        <h2
          style={{
            fontSize: "clamp(28px, 5vw, 44px)",
            lineHeight: "1.15",
            margin: "0 auto 14px",
            color: "#0f172a",
            maxWidth: "800px",
          }}
        >
          Everything you need for your images
        </h2>

        <p
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            fontSize: "18px",
            lineHeight: "1.7",
            color: "#64748b",
          }}
        >
          Resize, compress, crop, convert, edit and manage your images and
          PDFs online with simple and easy-to-use tools.
        </p>
      </section>

      {/* FEATURED PVC SERVICE */}
      <section
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "10px 20px 30px",
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "28px",
            padding: "clamp(28px, 5vw, 55px)",
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)",
            color: "white",
            boxShadow: "0 25px 60px rgba(37, 99, 235, 0.25)",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              right: "-90px",
              top: "-100px",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              right: "130px",
              bottom: "-100px",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1.5fr) minmax(260px, 0.8fr)",
              gap: "35px",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: "700",
                  marginBottom: "18px",
                }}
              >
                🇮🇳 West Bengal Only • PVC Printing
              </div>

              <h2
                style={{
                  fontSize: "clamp(30px, 5vw, 48px)",
                  lineHeight: "1.1",
                  margin: "0 0 16px",
                  letterSpacing: "-1px",
                }}
              >
                Get Your PVC Card Printed Easily
              </h2>

              <p
                style={{
                  fontSize: "18px",
                  lineHeight: "1.7",
                  color: "#dbeafe",
                  maxWidth: "650px",
                  margin: "0 0 20px",
                }}
              >
                Order your PVC cards online from the comfort of your home.
                Upload your document, place your order and track the order
                status online.
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "25px",
                }}
              >
                {[
                  "Aadhaar PVC",
                  "PAN PVC",
                  "Driving Licence",
                  "Voter ID",
                  "Student ID",
                  "Employee ID",
                ].map((item) => (
                  <span
                    key={item}
                    style={{
                      padding: "7px 11px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      fontSize: "13px",
                    }}
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <Link
                  href="/pvc-printing"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "15px 24px",
                    borderRadius: "12px",
                    background: "white",
                    color: "#1d4ed8",
                    textDecoration: "none",
                    fontWeight: "800",
                    fontSize: "16px",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  }}
                >
                  🖨️ Order PVC Card
                </Link>

                <Link
                  href="/track-order"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "15px 24px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: "700",
                    fontSize: "16px",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  📦 Track My Order
                </Link>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: "22px",
                padding: "28px",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  fontSize: "54px",
                  marginBottom: "10px",
                }}
              >
                💳
              </div>

              <p
                style={{
                  margin: "0 0 5px",
                  color: "#bfdbfe",
                  fontSize: "14px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Starting From
              </p>

              <div
                style={{
                  fontSize: "42px",
                  fontWeight: "900",
                  marginBottom: "8px",
                }}
              >
                ₹75
              </div>

              <p
                style={{
                  margin: "0 0 20px",
                  color: "#dbeafe",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                Simple online ordering with secure payment and order tracking.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  fontSize: "14px",
                  color: "#e0ecff",
                }}
              >
                <span>✓ Multiple cards can be ordered</span>
                <span>✓ Upload front and back documents</span>
                <span>✓ Online payment</span>
                <span>✓ Track your order</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED A4 PAPER & PRINTER INK STORE */}
      <section
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "30px 20px 65px",
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "28px",
            padding: "clamp(28px, 5vw, 55px)",
            background:
              "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)",
            color: "white",
            boxShadow: "0 25px 60px rgba(16, 185, 129, 0.22)",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              right: "-100px",
              top: "-120px",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "190px",
              height: "190px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              left: "-90px",
              bottom: "-110px",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1.5fr) minmax(260px, 0.8fr)",
              gap: "35px",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: "700",
                  marginBottom: "18px",
                }}
              >
                🛒 Online Store • A4 Paper & Printer Ink
              </div>

              <h2
                style={{
                  fontSize: "clamp(30px, 5vw, 48px)",
                  lineHeight: "1.1",
                  margin: "0 0 16px",
                  letterSpacing: "-1px",
                }}
              >
                A4 Paper & Printer Ink
                <br />
                Delivered to Your Door
              </h2>

              <p
                style={{
                  fontSize: "18px",
                  lineHeight: "1.7",
                  color: "#d1fae5",
                  maxWidth: "650px",
                  margin: "0 0 22px",
                }}
              >
                Shop quality A4 paper and printer ink online. Choose different
                paper types, GSM options and printer inks, add multiple
                products to your cart and place one easy order.
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "25px",
                }}
              >
                {[
                  "A4 70 GSM",
                  "A4 75 GSM",
                  "A4 80 GSM",
                  "A4 90 GSM",
                  "Printer Ink",
                ].map((item) => (
                  <span
                    key={item}
                    style={{
                      padding: "7px 11px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      fontSize: "13px",
                    }}
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <Link
                  href="/paper-ink-store"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "15px 24px",
                    borderRadius: "12px",
                    background: "white",
                    color: "#047857",
                    textDecoration: "none",
                    fontWeight: "800",
                    fontSize: "16px",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  }}
                >
                  🛒 Shop A4 Paper & Ink
                </Link>

                <Link
                  href="/track-order"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "15px 24px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: "700",
                    fontSize: "16px",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  📦 Track Store Order
                </Link>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: "22px",
                padding: "28px",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  fontSize: "52px",
                  marginBottom: "12px",
                }}
              >
                📄 🖨️
              </div>

              <p
                style={{
                  margin: "0 0 8px",
                  color: "#a7f3d0",
                  fontSize: "14px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Shop Online
              </p>

              <h3
                style={{
                  margin: "0 0 18px",
                  fontSize: "27px",
                  lineHeight: "1.2",
                }}
              >
                Paper + Ink
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "11px",
                  fontSize: "14px",
                  color: "#d1fae5",
                }}
              >
                <span>✓ Multiple products in one cart</span>
                <span>✓ Different GSM paper options</span>
                <span>✓ Printer ink available</span>
                <span>✓ Secure online payment</span>
                <span>✓ Order tracking available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMAGE TOOLS */}
      <section
        id="tools"
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "20px 20px 70px",
          scrollMarginTop: "30px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "7px 13px",
              borderRadius: "999px",
              background: "#f1f5f9",
              color: "#475569",
              fontSize: "13px",
              fontWeight: "700",
              marginBottom: "12px",
            }}
          >
            🛠️ ONLINE IMAGE TOOLS
          </div>

          <h2
            style={{
              fontSize: "clamp(28px, 5vw, 40px)",
              margin: "0 0 10px",
              color: "#0f172a",
            }}
          >
            Powerful Image & PDF Tools
          </h2>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "17px",
            }}
          >
            Everything you need to edit, convert and optimize your files.
          </p>
        </div>

        {/* Search */}
        <div
          style={{
            maxWidth: "680px",
            margin: "0 auto 38px",
            position: "relative",
          }}
        >
          <input
            type="text"
            placeholder="🔍 Search tools — JPG, PNG, PDF, Resize..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "17px 58px 17px 20px",
              border: "1px solid #dbe3ef",
              borderRadius: "15px",
              fontSize: "16px",
              outline: "none",
              boxSizing: "border-box",
              background: "white",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
            }}
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "36px",
                height: "36px",
                border: "none",
                borderRadius: "50%",
                background: "#e2e8f0",
                color: "#334155",
                fontSize: "17px",
                cursor: "pointer",
                fontWeight: "700",
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tools grid */}
        {filteredTools.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "18px",
            }}
          >
            {filteredTools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.link}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    minHeight: "170px",
                    padding: "24px 18px",
                    borderRadius: "18px",
                    background: "white",
                    border: "1px solid #e5e7eb",
                    textAlign: "center",
                    boxShadow:
                      "0 8px 25px rgba(15, 23, 42, 0.07)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "58px",
                      height: "58px",
                      margin: "0 auto 15px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "16px",
                      background: `${tool.color}15`,
                      color: tool.color,
                      fontSize: "32px",
                    }}
                  >
                    {tool.icon}
                  </div>

                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: "17px",
                      color: "#0f172a",
                    }}
                  >
                    {tool.name}
                  </h3>

                  {tool.description ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        lineHeight: "1.5",
                        color: "#64748b",
                      }}
                    >
                      {tool.description}
                    </p>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#94a3b8",
                      }}
                    >
                      Open tool →
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* No results */}
        {filteredTools.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "white",
              borderRadius: "20px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: "50px", marginBottom: "10px" }}>
              🔍
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: "22px" }}>
              No tools found
            </h3>

            <p style={{ margin: 0, color: "#64748b" }}>
              Try searching for JPG, PNG, PDF or Resize.
            </p>
          </div>
        )}

        {/* View all */}
        <div
          style={{
            textAlign: "center",
            marginTop: "35px",
          }}
        >
          <Link
            href="/tools"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 25px",
              background: "#2563eb",
              color: "white",
              textDecoration: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "800",
              boxShadow: "0 8px 20px rgba(37,99,235,0.2)",
            }}
          >
            🛠️ View All Tools →
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        style={{
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          borderBottom: "1px solid #e2e8f0",
          padding: "70px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "1050px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "38px",
            }}
          >
            <span
              style={{
                color: "#2563eb",
                fontWeight: "800",
                fontSize: "13px",
              }}
            >
              HOW IT WORKS
            </span>

            <h2
              style={{
                fontSize: "clamp(28px, 5vw, 40px)",
                margin: "10px 0",
                color: "#0f172a",
              }}
            >
              Simple. Fast. Easy.
            </h2>

            <p
              style={{
                color: "#64748b",
                fontSize: "16px",
                margin: 0,
              }}
            >
              Get your work done in just a few simple steps.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            {[
              {
                number: "01",
                icon: "📤",
                title: "Upload",
                text: "Choose your image or document from your device.",
              },
              {
                number: "02",
                icon: "⚙️",
                title: "Process",
                text: "Use the tool you need to edit, convert or optimize it.",
              },
              {
                number: "03",
                icon: "⬇️",
                title: "Download",
                text: "Download your finished file quickly and easily.",
              },
              {
                number: "04",
                icon: "📦",
                title: "Track",
                text: "For PVC and store orders, track your order status online.",
              },
            ].map((step) => (
              <div
                key={step.number}
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "18px",
                  padding: "25px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "900",
                    color: "#2563eb",
                    marginBottom: "12px",
                  }}
                >
                  STEP {step.number}
                </div>

                <div
                  style={{
                    fontSize: "36px",
                    marginBottom: "12px",
                  }}
                >
                  {step.icon}
                </div>

                <h3
                  style={{
                    margin: "0 0 8px",
                    color: "#0f172a",
                  }}
                >
                  {step.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#64748b",
                    lineHeight: "1.6",
                    fontSize: "14px",
                  }}
                >
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <section
        style={{
          maxWidth: "1050px",
          margin: "0 auto",
          padding: "65px 20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "20px",
          }}
        >
          {[
            {
              value: tools.length,
              label: "Powerful Tools",
              icon: "🛠️",
            },
            {
              value: "100%",
              label: "Free Image Tools",
              icon: "✨",
            },
            {
              value: "Fast",
              label: "Easy to Use",
              icon: "⚡",
            },
            {
              value: "West Bengal",
              label: "PVC Printing",
              icon: "🇮🇳",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                textAlign: "center",
                padding: "25px 15px",
                borderRadius: "18px",
                background: "white",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>
                {stat.icon}
              </div>

              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "900",
                  color: "#2563eb",
                }}
              >
                {stat.value}
              </div>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "10px 20px 60px",
        }}
      >
        <WhyChooseUs />
      </section>

      {/* TESTIMONIALS */}
      <section
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "10px 20px 60px",
        }}
      >
        <Testimonials />
      </section>

      {/* FAQ */}
      <section
        id="faq"
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "10px 20px 60px",
          scrollMarginTop: "30px",
        }}
      >
        <FAQ />
      </section>

      {/* FINAL CTA */}
      <section
        style={{
          padding: "20px 20px 70px",
        }}
      >
        <div
          style={{
            maxWidth: "1050px",
            margin: "0 auto",
            textAlign: "center",
            padding: "45px 25px",
            borderRadius: "25px",
            background:
              "linear-gradient(135deg, #eff6ff, #dbeafe)",
            border: "1px solid #bfdbfe",
          }}
        >
          <div style={{ fontSize: "42px", marginBottom: "10px" }}>
            🚀
          </div>

          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "clamp(27px, 5vw, 38px)",
              color: "#0f172a",
            }}
          >
            Ready to get started?
          </h2>

          <p
            style={{
              margin: "0 auto 25px",
              maxWidth: "650px",
              color: "#475569",
              lineHeight: "1.7",
            }}
          >
            Choose an image tool, order your PVC card, or shop for A4 paper
            and printer ink online. Everything is designed to be simple and
            easy to use.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <Link
              href="/tools"
              style={{
                padding: "14px 24px",
                borderRadius: "12px",
                background: "#2563eb",
                color: "white",
                textDecoration: "none",
                fontWeight: "800",
              }}
            >
              🛠️ Explore Image Tools
            </Link>

            <Link
              href="/pvc-printing"
              style={{
                padding: "14px 24px",
                borderRadius: "12px",
                background: "white",
                color: "#1d4ed8",
                border: "1px solid #93c5fd",
                textDecoration: "none",
                fontWeight: "800",
              }}
            >
              💳 Order PVC Card
            </Link>

            <Link
              href="/paper-ink-store"
              style={{
                padding: "14px 24px",
                borderRadius: "12px",
                background: "#047857",
                color: "white",
                border: "1px solid #047857",
                textDecoration: "none",
                fontWeight: "800",
              }}
            >
              🛒 Shop Paper & Ink
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "10px 20px 50px",
          scrollMarginTop: "30px",
        }}
      >
        <Contact />
      </section>
    </main>
  );
}