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
    color: "#8b5cf6",
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
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      {/* Hero */}
      <Hero />

      {/* Main description */}
      <p
        style={{
          textAlign: "center",
          fontSize: "20px",
          color: "#666",
          marginBottom: "25px",
        }}
      >
        Resize, Compress and Convert Images Instantly – 100% Free
      </p>

      {/* Search */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto 40px",
          position: "relative",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Search tools... (JPG, PNG, PDF, Resize)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "16px 55px 16px 20px",
            border: "2px solid #e5e7eb",
            borderRadius: "14px",
            fontSize: "17px",
            outline: "none",
            boxSizing: "border-box",
            boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
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
              background: "#e5e7eb",
              color: "#333",
              fontSize: "18px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tools heading and anchor */}
      <div
        id="tools"
        style={{
          scrollMarginTop: "20px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "32px",
            color: "#1e3a8a",
            marginBottom: "25px",
          }}
        >
          🛠️ Image Tools
        </h2>
      </div>

      {/* Tools */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
        }}
      >
        {filteredTools.map((tool) => (
          <Link
            key={tool.name}
            href={tool.link}
            style={{
              textDecoration: "none",
            }}
          >
            <div
              style={{
                background: tool.color,
                color: "white",
                padding: "25px 15px",
                borderRadius: "18px",
                textAlign: "center",
                cursor: "pointer",
                boxShadow:
                  "0 10px 25px rgba(0,0,0,0.15)",
                transform: "translateY(0)",
                minHeight: "170px",
              }}
            >
              <div
                style={{
                  fontSize: "45px",
                  marginBottom: "15px",
                }}
              >
                {tool.icon}
              </div>

              <h2
                style={{
                  margin: "0",
                  fontSize: "19px",
                }}
              >
                {tool.name}
              </h2>

              {tool.description && (
                <p
                  style={{
                    marginTop: "10px",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    opacity: 0.95,
                  }}
                >
                  {tool.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
            {/* View All Tools */}
      <div
        style={{
          textAlign: "center",
          marginTop: "35px",
        }}
      >
        <Link
          href="/tools"
          style={{
            display: "inline-block",
            padding: "14px 28px",
            background: "#2563eb",
            color: "white",
            textDecoration: "none",
            borderRadius: "10px",
            fontSize: "17px",
            fontWeight: "bold",
            boxShadow: "0 5px 15px rgba(0,0,0,0.12)",
          }}
        >
          🛠️ View All Tools
        </Link>
      </div>

      {/* No results */}
      {filteredTools.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            color: "#666",
          }}
        >
          <div
            style={{
              fontSize: "50px",
            }}
          >
            🔍
          </div>

          <h2>No tools found</h2>

          <p>
            Try searching for JPG, PNG, PDF or Resize.
          </p>
        </div>
      )}

      {/* Statistics */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap",
          marginTop: "60px",
          gap: "20px",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: "#2563eb",
              fontSize: "40px",
              marginBottom: "5px",
            }}
          >
            {tools.length}
          </h2>

          <p>Powerful Tools</p>
        </div>

        <div
          style={{
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: "#10b981",
              fontSize: "40px",
              marginBottom: "5px",
            }}
          >
            100%
          </h2>

          <p>Free to Use</p>
        </div>

        <div
          style={{
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: "#ef4444",
              fontSize: "40px",
              marginBottom: "5px",
            }}
          >
            Secure
          </h2>

          <p>No Upload to Server</p>
        </div>
      </div>

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ */}
      <div id="faq">
        <FAQ />
      </div>

      {/* Contact */}
      <div id="contact">
        <Contact />
      </div>
    </main>
  );
}