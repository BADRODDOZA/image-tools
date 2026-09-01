"use client";

import { useState } from "react";

export default function AddWatermarkPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [watermark, setWatermark] = useState("© Image Tools");
  const [position, setPosition] = useState("bottom-right");
  const [opacity, setOpacity] = useState(0.6);
  const [fontSize, setFontSize] = useState(32);

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setResult(null);

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const addWatermark = () => {
    if (!image || !watermark.trim()) return;

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
      ctx.lineWidth = 2;

      const padding = 30;
      const textWidth = ctx.measureText(watermark).width;

      let x = 0;
      let y = 0;

      if (position === "top-left") {
        x = padding;
        y = padding + fontSize;
      }

      if (position === "top-center") {
        x = (canvas.width - textWidth) / 2;
        y = padding + fontSize;
      }

      if (position === "top-right") {
        x = canvas.width - textWidth - padding;
        y = padding + fontSize;
      }

      if (position === "center") {
        x = (canvas.width - textWidth) / 2;
        y = canvas.height / 2;
      }

      if (position === "bottom-left") {
        x = padding;
        y = canvas.height - padding;
      }

      if (position === "bottom-center") {
        x = (canvas.width - textWidth) / 2;
        y = canvas.height - padding;
      }

      if (position === "bottom-right") {
        x = canvas.width - textWidth - padding;
        y = canvas.height - padding;
      }

      ctx.strokeText(watermark, x, y);
      ctx.fillText(watermark, x, y);

      setResult(canvas.toDataURL("image/png"));
    };

    img.src = image;
  };

  const downloadResult = () => {
    if (!result) return;

    const link = document.createElement("a");

    link.href = result;
    link.download = "watermarked-image.png";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          color: "#1e3a8a",
          marginBottom: "10px",
        }}
      >
        💧 Add Watermark
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: "30px",
        }}
      >
        Add custom text watermarks to your images.
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
          onChange={handleFile}
        />
      </div>

      {image && (
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow:
              "0 8px 25px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              color: "#1e3a8a",
              marginBottom: "20px",
            }}
          >
            ⚙️ Watermark Settings
          </h2>

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Watermark Text
          </label>

          <input
            type="text"
            value={watermark}
            onChange={(e) =>
              setWatermark(e.target.value)
            }
            placeholder="Enter watermark text"
            style={{
              width: "100%",
              padding: "13px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              boxSizing: "border-box",
              marginBottom: "20px",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Position
          </label>

          <select
            value={position}
            onChange={(e) =>
              setPosition(e.target.value)
            }
            style={{
              width: "100%",
              padding: "13px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              marginBottom: "20px",
            }}
          >
            <option value="top-left">
              Top Left
            </option>
            <option value="top-center">
              Top Center
            </option>
            <option value="top-right">
              Top Right
            </option>
            <option value="center">
              Center
            </option>
            <option value="bottom-left">
              Bottom Left
            </option>
            <option value="bottom-center">
              Bottom Center
            </option>
            <option value="bottom-right">
              Bottom Right
            </option>
          </select>

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Font Size: {fontSize}px
          </label>

          <input
            type="range"
            min="12"
            max="100"
            value={fontSize}
            onChange={(e) =>
              setFontSize(Number(e.target.value))
            }
            style={{
              width: "100%",
              marginBottom: "20px",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Opacity: {Math.round(opacity * 100)}%
          </label>

          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) =>
              setOpacity(Number(e.target.value))
            }
            style={{
              width: "100%",
              marginBottom: "25px",
            }}
          />

          <img
            src={image}
            alt="Original"
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "450px",
              margin: "0 auto 25px",
              borderRadius: "12px",
            }}
          />

          <button
            onClick={addWatermark}
            style={{
              width: "100%",
              padding: "15px",
              background: "#0891b2",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            💧 Add Watermark
          </button>

          {result && (
            <div
              style={{
                marginTop: "30px",
                paddingTop: "25px",
                borderTop: "1px solid #ddd",
              }}
            >
              <h2
                style={{
                  textAlign: "center",
                  color: "#16a34a",
                }}
              >
                ✅ Watermarked Image
              </h2>

              <img
                src={result}
                alt="Watermarked result"
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "450px",
                  margin: "20px auto",
                  borderRadius: "12px",
                }}
              />

              <button
                onClick={downloadResult}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                📥 Download Watermarked Image
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}