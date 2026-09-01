"use client";

import { useState } from "react";

export default function FAQ() {
  const faqs = [
    {
      question: "Is Image Tools free to use?",
      answer:
        "Yes! All our image tools are completely free to use. There are no registration fees or subscriptions required.",
    },
    {
      question: "Are my images secure?",
      answer:
        "Yes. Your images are processed in your browser whenever possible and are not stored on our servers.",
    },
    {
      question: "Does it work on mobile devices?",
      answer:
        "Yes. Image Tools works on desktop computers, tablets, and mobile phones.",
    },
    {
      question: "Which image formats are supported?",
      answer:
        "We support formats such as JPG, JPEG, PNG, and WebP. More formats and tools may be added in the future.",
    },
    {
      question: "Can I resize my images?",
      answer:
        "Yes! You can resize images by dimensions, pixels, percentage, and use other image editing tools available on the website.",
    },
    {
      question: "Can I convert images to PDF?",
      answer:
        "Yes. You can convert images to PDF and use our image-to-PDF tools to create PDF files from your images.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
        ❓ Frequently Asked Questions
      </h2>

      <p
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: "40px",
        }}
      >
        Find answers to common questions about Image Tools.
      </p>

      <div
        style={{
          display: "grid",
          gap: "15px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={faq.question}
              style={{
                background: "white",
                borderRadius: "15px",
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                border: "1px solid #eef2f7",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                style={{
                  width: "100%",
                  padding: "20px",
                  border: "none",
                  background: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "17px",
                  fontWeight: "bold",
                  color: "#2563eb",
                }}
              >
                <span>{faq.question}</span>

                <span
                  style={{
                    fontSize: "24px",
                    marginLeft: "15px",
                  }}
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div
                  style={{
                    padding: "0 20px 20px",
                    color: "#555",
                    lineHeight: "1.7",
                  }}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}