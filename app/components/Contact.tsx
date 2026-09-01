export default function Contact() {
  return (
    <section
      style={{
        marginTop: "80px",
        textAlign: "center",
        background: "#2563eb",
        color: "white",
        padding: "55px 20px",
        borderRadius: "20px",
      }}
    >
      <h2
        style={{
          fontSize: "36px",
          marginBottom: "15px",
        }}
      >
        📞 Contact Us
      </h2>

      <p
        style={{
          maxWidth: "600px",
          margin: "0 auto 25px",
          lineHeight: "1.7",
          fontSize: "17px",
        }}
      >
        Have a question, suggestion, or found a problem?
        We'd love to hear from you. Contact us and we'll
        do our best to help.
      </p>

      <a
        href="mailto:support@imagetools.com?subject=Image Tools Support"
        style={{
          display: "inline-block",
          background: "white",
          color: "#2563eb",
          textDecoration: "none",
          padding: "15px 30px",
          borderRadius: "10px",
          fontSize: "18px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        ✉️ Contact Support
      </a>

      <p
        style={{
          marginTop: "20px",
          fontSize: "14px",
          opacity: 0.9,
        }}
      >
        We appreciate your feedback! 💙
      </p>
    </section>
  );
}