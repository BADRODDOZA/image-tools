export default function Testimonials() {
  const reviews = [
    {
      name: "Sarah",
      text: "This website is super easy to use. I resized my photos in seconds!",
    },
    {
      name: "James",
      text: "Fast, free, and no complicated steps. Exactly what I needed.",
    },
    {
      name: "Aisha",
      text: "I use these tools almost every day. Highly recommended!",
    },
  ];

  return (
    <section
      style={{
        marginTop: "80px",
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
        ⭐ What Our Users Say
      </h2>

      <p
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: "40px",
        }}
      >
        See what people think about Image Tools.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {reviews.map((review) => (
          <div
            key={review.name}
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "18px",
              boxShadow:
                "0 8px 25px rgba(0,0,0,0.08)",
              border: "1px solid #eef2f7",
            }}
          >
            {/* Stars */}
            <div
              style={{
                fontSize: "20px",
                marginBottom: "15px",
              }}
            >
              ⭐⭐⭐⭐⭐
            </div>

            {/* Review */}
            <p
              style={{
                color: "#555",
                lineHeight: "1.7",
                marginBottom: "20px",
                fontSize: "16px",
              }}
            >
              "{review.text}"
            </p>

            {/* User */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                }}
              >
                👤
              </div>

              <div>
                <h3
                  style={{
                    margin: 0,
                    color: "#2563eb",
                    fontSize: "17px",
                  }}
                >
                  {review.name}
                </h3>

                <span
                  style={{
                    fontSize: "13px",
                    color: "#888",
                  }}
                >
                  Verified User
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}