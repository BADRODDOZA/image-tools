export default function WhyChooseUs() {
  const features = [
    {
      icon: "⚡",
      title: "Fast Processing",
      description:
        "Resize, compress, convert and edit images quickly in your browser.",
    },
    {
      icon: "🔒",
      title: "Private & Secure",
      description:
        "Your images are processed locally whenever the tool supports browser-based processing.",
    },
    {
      icon: "💯",
      title: "100% Free",
      description:
        "Use our image tools for free without complicated subscriptions.",
    },
    {
      icon: "📱",
      title: "Works Everywhere",
      description:
        "Use Image Tools on desktop, tablet and mobile devices.",
    },
  ];

  return (
    <section
      style={{
        marginTop: "70px",
        padding: "20px 0",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontSize: "36px",
          color: "#1e3a8a",
          marginBottom: "15px",
        }}
      >
        Why Choose Image Tools?
      </h2>

      <p
        style={{
          textAlign: "center",
          color: "#666",
          maxWidth: "650px",
          margin: "0 auto 40px",
          lineHeight: "1.6",
        }}
      >
        Simple, fast and convenient image tools designed
        to help you work with your images without
        unnecessary complexity.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
        }}
      >
        {features.map((feature) => (
          <div
            key={feature.title}
            style={{
              background: "white",
              padding: "30px 20px",
              borderRadius: "18px",
              textAlign: "center",
              boxShadow:
                "0 8px 20px rgba(0,0,0,0.08)",
              border: "1px solid #eef2f7",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "15px",
              }}
            >
              {feature.icon}
            </div>

            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "21px",
                color: "#1e3a8a",
              }}
            >
              {feature.title}
            </h3>

            <p
              style={{
                color: "#666",
                margin: 0,
                lineHeight: "1.6",
                fontSize: "15px",
              }}
            >
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Privacy message */}
      <div
        style={{
          marginTop: "35px",
          padding: "22px",
          background: "#eff6ff",
          borderRadius: "15px",
          textAlign: "center",
          border: "1px solid #dbeafe",
        }}
      >
        <h3
          style={{
            margin: "0 0 8px",
            color: "#1e40af",
          }}
        >
          🔐 Your Privacy Matters
        </h3>

        <p
          style={{
            margin: 0,
            color: "#475569",
            lineHeight: "1.6",
          }}
        >
          We aim to keep image processing as private
          as possible. Tools that process files directly
          in your browser do not need to upload those
          images to our server.
        </p>
      </div>
    </section>
  );
}