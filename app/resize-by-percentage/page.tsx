"use client";

import { useState } from "react";

export default function ResizePercentagePage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [percentage, setPercentage] = useState(50);

  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);

  const [newWidth, setNewWidth] = useState(0);
  const [newHeight, setNewHeight] = useState(0);

  const handleFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result as string;

      const img = new Image();

      img.onload = () => {
        setImage(imageData);

        setOriginalWidth(img.width);
        setOriginalHeight(img.height);

        const width = Math.round(
          img.width * (percentage / 100)
        );

        const height = Math.round(
          img.height * (percentage / 100)
        );

        setNewWidth(width);
        setNewHeight(height);

        setResult(null);
      };

      img.src = imageData;
    };

    reader.readAsDataURL(file);
  };

  const updatePercentage = (value: number) => {
    setPercentage(value);

    if (originalWidth && originalHeight) {
      setNewWidth(
        Math.round(originalWidth * (value / 100))
      );

      setNewHeight(
        Math.round(originalHeight * (value / 100))
      );
    }
  };

  const resizeImage = () => {
    if (!image) return;

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.drawImage(
        img,
        0,
        0,
        newWidth,
        newHeight
      );

      setResult(
        canvas.toDataURL("image/png")
      );
    };

    img.src = image;
  };

  const downloadImage = () => {
    if (!result) return;

    const link = document.createElement("a");

    link.href = result;
    link.download = `resized-${percentage}percent.png`;

    link.click();
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "50px 20px",
        background:
          "linear-gradient(135deg, #eef4ff, #f8fbff)",
      }}
    >
      <div
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          background: "white",
          padding: "35px",
          borderRadius: "20px",
          boxShadow:
            "0 10px 40px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "38px",
            marginBottom: "10px",
          }}
        >
          📐 Resize by Percentage
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "30px",
          }}
        >
          Resize your image using a percentage of its
          original dimensions.
        </p>

        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (file) {
                handleFile(file);
              }
            }}
          />
        </div>

        {image && (
          <>
            <div
              style={{
                textAlign: "center",
                marginBottom: "25px",
              }}
            >
              <img
                src={image}
                alt="Original image"
                style={{
                  maxWidth: "100%",
                  maxHeight: "400px",
                  borderRadius: "12px",
                }}
              />
            </div>

            <div
              style={{
                background: "#f8fafc",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "25px",
              }}
            >
              <p>
                Original size:{" "}
                <strong>
                  {originalWidth} × {originalHeight}px
                </strong>
              </p>

              <label>
                Resize Percentage:{" "}
                <strong>{percentage}%</strong>
              </label>

              <input
                type="range"
                min="10"
                max="300"
                value={percentage}
                onChange={(e) =>
                  updatePercentage(
                    Number(e.target.value)
                  )
                }
                style={{
                  width: "100%",
                  marginTop: "15px",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "15px",
                }}
              >
                {[25, 50, 75, 100, 150, 200].map(
                  (value) => (
                    <button
                      key={value}
                      onClick={() =>
                        updatePercentage(value)
                      }
                      style={{
                        padding: "9px 15px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        background:
                          percentage === value
                            ? "#3b82f6"
                            : "white",
                        color:
                          percentage === value
                            ? "white"
                            : "#333",
                        cursor: "pointer",
                      }}
                    >
                      {value}%
                    </button>
                  )
                )}
              </div>

              <p style={{ marginTop: "20px" }}>
                New size:{" "}
                <strong>
                  {newWidth} × {newHeight}px
                </strong>
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                onClick={resizeImage}
                style={{
                  padding: "14px 30px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#3b82f6",
                  color: "white",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                📐 Resize Image
              </button>
            </div>
          </>
        )}

        {result && (
          <div
            style={{
              textAlign: "center",
              marginTop: "35px",
            }}
          >
            <h2>Resized Preview</h2>

            <img
              src={result}
              alt="Resized image"
              style={{
                maxWidth: "100%",
                maxHeight: "450px",
                marginTop: "15px",
                borderRadius: "12px",
              }}
            />

            <br />

            <button
              onClick={downloadImage}
              style={{
                marginTop: "20px",
                padding: "14px 30px",
                border: "none",
                borderRadius: "10px",
                background: "#10b981",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              📥 Download Image
            </button>
          </div>
        )}
      </div>
    </main>
  );
}