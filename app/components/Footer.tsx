import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#1e3a8a",
        color: "white",
        marginTop: "60px",
        padding: "50px 30px 25px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "35px",
        }}
      >
        {/* Brand */}
        <div>
          <h2 style={{ marginTop: 0 }}>
            🖼️ Image Tools
          </h2>

          <p
            style={{
              lineHeight: "1.6",
              color: "#dbeafe",
            }}
          >
            Free online tools to resize, compress
            and convert your images quickly and
            easily.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3>Quick Links</h3>

          <Link
            href="/"
            style={{
              display: "block",
              color: "white",
              textDecoration: "none",
              marginBottom: "12px",
            }}
          >
            🏠 Home
          </Link>

          <a
            href="/#tools"
            style={{
              display: "block",
              color: "white",
              textDecoration: "none",
              marginBottom: "12px",
            }}
          >
            🛠️ Tools
          </a>

          <a
            href="/#faq"
            style={{
              display: "block",
              color: "white",
              textDecoration: "none",
              marginBottom: "12px",
            }}
          >
            ❓ FAQ
          </a>

          <a
            href="/#contact"
            style={{
              display: "block",
              color: "white",
              textDecoration: "none",
            }}
          >
            📩 Contact
          </a>
        </div>

        {/* Popular Tools */}
        <div>
          <h3>Popular Tools</h3>

          <Link
            href="/resize"
            style={{
              display: "block",
              color: "white",
              textDecoration: "none",
              marginBottom: "12px",
            }}
          >
            📏 Resize Image
          </Link>

          <Link
            href="/compress"
            style={{
              display: "block",
              color: "white",
              textDecoration: "none",
              marginBottom: "12px",
            }}
          >
            🗜️ Compress Image
          </Link>

          <Link
            href="/jpg-to-png"
            style={{
              display: "block",
              color: "white",
              textDecoration: "none",
              marginBottom: "12px",
            }}
          >
            🖼️ JPG to PNG
          </Link>

          <Link
            href="/image-to-pdf"
            style={{
              display: "block",
              color: "white",
              textDecoration: "none",
            }}
          >
            📄 Image to PDF
          </Link>
        </div>

        {/* Legal */}
        <div>
          <h3>Information</h3>

          <Link
            href="/about"
            style={{
              display: "block",
              color: "white",
              textDecoration: "none",
              marginBottom: "12px",
            }}
          >
            👋 About Us
          </Link>

          <Link
            href="/privacy"
            style={{
              display: "block",
              color: "white",
              textDecoration: "none",
              marginBottom: "12px",
            }}
          >
            🔒 Privacy Policy
          </Link>

          <Link
            href="/terms"
            style={{
              display: "block",
              color: "white",
              textDecoration: "none",
            }}
          >
            📜 Terms of Use
          </Link>
        </div>
      </div>

      {/* Bottom */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "40px auto 0",
          paddingTop: "20px",
          borderTop: "1px solid rgba(255,255,255,0.2)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#dbeafe",
            fontSize: "14px",
          }}
        >
          © 2026 Image Tools. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}