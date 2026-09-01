"use client";

import { useState } from "react";

export default function PngToWebpPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [fileName, setFileName] = useState("converted-image");

  const handleFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
      setResult(null);
      setFileName(file.name.replace(/\.[^/.]+$/, ""));
    };

    reader.readAsDataURL(file);
  };

  const convertToWebP = () => {
    if (!image) return;

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      const webpImage = canvas.toDataURL("image/webp", 0.9);

      setResult(webpImage);
    };

    img.src = image;
  };

  const downloadImage = () => {
    if (!result) return;

    const link = document.createElement("a");

    link.href = result;
    link.download = `${fileName}.webp`;

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
          🌐 PNG to WebP
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "30px",
          }}
        >
          Convert PNG images to WebP format while reducing file size.
        </p>

        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <input
            type="file"
            accept="image/png"
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (file) {
                handleFile(file);
              }
            }}
          />
        </div>

        {image && !result && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "25px",
            }}
          >
            <img
              src={image}
              alt="Original PNG"
              style={{
                maxWidth: "100%",
                maxHeight: "450px",
                borderRadius: "12px",
              }}
            />

            <br />

            <button
              onClick={convertToWebP}
              style={{
                marginTop: "20px",
                padding: "14px 30px",
                border: "none",
                borderRadius: "10px",
                background: "#8b5cf6",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              🔄 Convert to WebP
            </button>
          </div>
        )}

        {result && (
          <div style={{ textAlign: "center" }}>
            <h2>Converted Image</h2>

            <img
              src={result}
              alt="WebP preview"
              style={{
                maxWidth: "100%",
                maxHeight: "450px",
                borderRadius: "12px",
                marginTop: "15px",
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
              📥 Download WebP
            </button>
          </div>
        )}
      </div>
    </main>
  );
}