"use client";

import { useState } from "react";

export default function RotatePage() {
  const [image, setImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
      setResult(reader.result as string);
      setRotation(0);
    };

    reader.readAsDataURL(file);
  };

  const rotateImage = (degrees: number) => {
    if (!image) return;

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      const newRotation = (rotation + degrees + 360) % 360;
      setRotation(newRotation);

      if (newRotation === 90 || newRotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((newRotation * Math.PI) / 180);

      ctx.drawImage(
        img,
        -img.width / 2,
        -img.height / 2
      );

      setResult(canvas.toDataURL("image/png"));
    };

    img.src = image;
  };

  const downloadImage = () => {
    if (!result) return;

    const link = document.createElement("a");

    link.href = result;
    link.download = "rotated-image.png";

    link.click();
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "50px 20px",
        background: "linear-gradient(135deg, #eef4ff, #f8fbff)",
      }}
    >
      <div
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          background: "white",
          padding: "35px",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "38px",
            marginBottom: "10px",
          }}
        >
          🔄 Rotate Image
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "30px",
          }}
        >
          Rotate your image quickly and download the result.
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

        {result && (
          <>
            <div
              style={{
                textAlign: "center",
                marginBottom: "25px",
              }}
            >
              <img
                src={result}
                alt="Rotated preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "450px",
                  borderRadius: "12px",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "25px",
              }}
            >
              <button
                onClick={() => rotateImage(-90)}
                style={{
                  padding: "13px 20px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#3b82f6",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                ↺ Rotate Left
              </button>

              <button
                onClick={() => rotateImage(90)}
                style={{
                  padding: "13px 20px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#10b981",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                ↻ Rotate Right
              </button>

              <button
                onClick={() => rotateImage(180)}
                style={{
                  padding: "13px 20px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#f59e0b",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                🔄 Rotate 180°
              </button>
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                onClick={downloadImage}
                style={{
                  padding: "14px 30px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#111827",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                📥 Download Image
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}