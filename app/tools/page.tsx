"use client";

import { useState } from "react";
import Link from "next/link";

const categories = [
  {
    title: "📐 Resize & Compression",
    tools: [
      {
        name: "Resize Image",
        description: "Resize your images to any width and height.",
        icon: "📏",
        href: "/resize",
      },
      {
        name: "Compress Image",
        description: "Reduce image file size while keeping good quality.",
        icon: "🗜️",
        href: "/compress",
      },
      {
        name: "Resize by Pixels",
        description: "Resize images using exact pixel dimensions.",
        icon: "📐",
        href: "/resize-by-pixels",
      },
      {
        name: "Resize by Percentage",
        description: "Resize images using a percentage.",
        icon: "📊",
        href: "/resize-by-percentage",
      },
    ],
  },

  {
    title: "🔄 Image Conversion",
    tools: [
      {
        name: "JPG to PNG",
        description: "Convert JPG images to PNG format.",
        icon: "🖼️",
        href: "/jpg-to-png",
      },
      {
        name: "PNG to JPG",
        description: "Convert PNG images to JPG format.",
        icon: "📸",
        href: "/png-to-jpg",
      },
      {
        name: "JPG to WebP",
        description: "Convert JPG images to modern WebP format.",
        icon: "🌐",
        href: "/jpg-to-webp",
      },
      {
        name: "WebP to JPG",
        description: "Convert WebP images to JPG format.",
        icon: "🔄",
        href: "/webp-to-jpg",
      },
      {
        name: "WebP to PNG",
        description: "Convert WebP images to PNG format.",
        icon: "🔄",
        href: "/webp-to-png",
      },
      {
        name: "Image to WebP",
        description: "Convert images to modern WebP format.",
        icon: "🌐",
        href: "/image-to-webp",
      },
      {
        name: "Image to JPG / JPEG",
        description:
          "Convert images to JPG/JPEG, resize dimensions, and control file size in KB.",
        icon: "🖼️",
        href: "/image-to-jpg",
      },
    ],
  },

  {
    title: "📄 PDF Tools",
    tools: [
      {
        name: "JPG to PDF",
        description: "Convert JPG images into PDF files.",
        icon: "📄",
        href: "/jpg-to-pdf",
      },
      {
        name: "PNG to PDF",
        description: "Convert PNG images into PDF files.",
        icon: "📄",
        href: "/png-to-pdf",
      },
      {
        name: "Image to PDF",
        description:
          "Convert images to PDF, resize dimensions, choose page settings, and control PDF size in KB.",
        icon: "📑",
        href: "/image-to-pdf",
      },
      {
        name: "PDF to JPG",
        description: "Convert PDF pages into JPG images.",
        icon: "🖼️",
        href: "/pdf-to-jpg",
      },
      {
        name: "PDF to PNG",
        description: "Convert PDF pages into PNG images.",
        icon: "🖼️",
        href: "/pdf-to-png",
      },
    ],
  },

  {
    title: "✨ Image Editing",
    tools: [
      {
        name: "Crop Image",
        description: "Crop your image to the exact area you need.",
        icon: "✂️",
        href: "/crop",
      },
      {
        name: "Flip Image",
        description: "Flip images horizontally or vertically.",
        icon: "🔄",
        href: "/flip",
      },
      {
        name: "Add Watermark",
        description: "Add a watermark to your images.",
        icon: "💧",
        href: "/add-watermark",
      },
      {
        name: "Remove Background",
        description:
          "Automatically remove the background from your image and download a transparent PNG.",
        icon: "✨",
        href: "/remove-background",
      },
      {
        name: "Image Information",
        description: "View image size, format and dimensions.",
        icon: "ℹ️",
        href: "/image-info",
      },
    ],
  },
];

export default function ToolsPage() {
  const [search, setSearch] = useState("");

  const searchText = search.toLowerCase().trim();

  const totalTools = categories.reduce(
    (total, category) => total + category.tools.length,
    0
  );

  const hasResults = categories.some((category) =>
    category.tools.some((tool) =>
      tool.name.toLowerCase().includes(searchText)
    )
  );

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px 60px",
      }}
    >
      {/* Header */}
      <section
        style={{
          textAlign: "center",
          marginBottom: "50px",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            marginBottom: "15px",
            color: "#1e3a8a",
          }}
        >
          🛠️ Image Tools
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#555",
            maxWidth: "700px",
            margin: "0 auto",
            lineHeight: "1.6",
          }}
        >
          Free online tools to resize, compress, convert, crop and
          manage your images quickly and easily.
        </p>

        {/* Tool Count */}
        <p
          style={{
            marginTop: "15px",
            fontSize: "16px",
            color: "#2563eb",
            fontWeight: "bold",
          }}
        >
          🛠️ {totalTools} Free Tools
        </p>

        {/* Back to Home */}
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: "10px",
            padding: "10px 20px",
            background: "#2563eb",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "bold",
          }}
        >
          🏠 Back to Home
        </Link>

        {/* Search */}
        <div
          style={{
            maxWidth: "600px",
            margin: "30px auto 0",
            position: "relative",
          }}
        >
          <input
            type="text"
            placeholder="🔍 Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "15px 55px 15px 20px",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              fontSize: "17px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />

          {/* Clear Search */}
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
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
            >
              ✕
            </button>
          )}
        </div>
      </section>

      {/* Categories */}
      {categories.map((category) => {
        const filteredTools = category.tools.filter((tool) =>
          tool.name.toLowerCase().includes(searchText)
        );

        if (search && filteredTools.length === 0) {
          return null;
        }

        return (
          <section
            key={category.title}
            style={{
              marginBottom: "50px",
            }}
          >
            <h2
              style={{
                fontSize: "28px",
                color: "#1e3a8a",
                marginBottom: "22px",
              }}
            >
              {category.title}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "22px",
              }}
            >
              {filteredTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      background: "white",
                      padding: "25px",
                      borderRadius: "18px",
                      boxShadow:
                        "0 5px 20px rgba(0,0,0,0.08)",
                      height: "100%",
                      boxSizing: "border-box",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "38px",
                        marginBottom: "15px",
                      }}
                    >
                      {tool.icon}
                    </div>

                    <h3
                      style={{
                        fontSize: "21px",
                        margin: "0 0 10px",
                        color: "#1e3a8a",
                      }}
                    >
                      {tool.name}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#666",
                        lineHeight: "1.6",
                      }}
                    >
                      {tool.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* No Results */}
      {search && !hasResults && (
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
            Try searching for JPG, PNG, PDF, WebP, Resize or
            Compress.
          </p>

          <button
            onClick={() => setSearch("")}
            style={{
              marginTop: "15px",
              padding: "12px 24px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🔄 Show All Tools
          </button>
        </div>
      )}
    </main>
  );
}