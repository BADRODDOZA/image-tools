import Link from "next/link";

export default function Hero() {
  return (
    <section
      style={{
        textAlign: "center",
        padding: "70px 20px 50px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "8px 16px",
          background: "#eff6ff",
          color: "#2563eb",
          borderRadius: "30px",
          fontSize: "14px",
          fontWeight: "bold",
          marginBottom: "20px",
        }}
      >
        ✨ Simple • Fast • Free
      </div>

      <h1
        style={{
          fontSize: "54px",
          color: "#1e3a8a",
          margin: "0 0 20px",
          lineHeight: "1.15",
        }}
      >
        🖼️ Free Online Image Tools
      </h1>

      <p
        style={{
          fontSize: "22px",
          color: "#555",
          maxWidth: "700px",
          margin: "0 auto 30px",
          lineHeight: "1.6",
        }}
      >
        Resize, compress and convert your images in
        seconds. Fast, convenient and completely free.
      </p>

      <Link
        href="/#tools"
        style={{
          display: "inline-block",
          background: "#2563eb",
          color: "white",
          textDecoration: "none",
          padding: "15px 35px",
          fontSize: "18px",
          fontWeight: "bold",
          borderRadius: "10px",
          boxShadow: "0 8px 20px rgba(37,99,235,0.25)",
        }}
      >
        🚀 Get Started
      </Link>

      <p
        style={{
          marginTop: "18px",
          color: "#777",
          fontSize: "14px",
        }}
      >
        🔒 No registration required
      </p>
    </section>
  );
}