"use client";

import { useState } from "react";

export default function ResizePixelsPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);

  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);

  const [keepRatio, setKeepRatio] = useState(true);

  const handleFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result as string;

      const img = new Image();

      img.onload = () => {
        setImage(imageData);

        setOriginalWidth(img.width);
        setOriginalHeight(img.height);

        setWidth(img.width);
        setHeight(img.height);

        setResult(null);
      };

      img.src = imageData;
    };

    reader.readAsDataURL(file);
  };

  const changeWidth = (newWidth: number) => {
    setWidth(newWidth);

    if (keepRatio && originalWidth && originalHeight) {
      const newHeight = Math.round(
        (newWidth / originalWidth) * originalHeight
      );

      setHeight(newHeight);
    }
  };

  const changeHeight = (newHeight: number) => {
    setHeight(newHeight);

    if (keepRatio && originalWidth && originalHeight) {
      const newWidth = Math.round(
        (newHeight / originalHeight) * originalWidth
      );

      setWidth(newWidth);
    }
  };

  const resizeImage = () => {
    if (!image || width <= 0 || height <= 0) return;

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.drawImage(
        img,
        0,
        0,
        width,
        height
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
    link.download = `resized-${width}x${height}.png`;

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
          📐 Resize by Pixels
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "30px",
          }}
        >
          Resize your image to an exact width and height.
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
                marginBottom: "30px",
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
                padding: "25px",
                borderRadius: "15px",
                marginBottom: "25px",
              }}
            >
              <p>
                Original size:{" "}
                <strong>
                  {originalWidth} × {originalHeight}px
                </strong>
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "20px",
                  marginTop: "20px",
                }}
              >
                <div>
                  <label>
                    Width (px)
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={width}
                    onChange={(e) =>
                      changeWidth(
                        Number(e.target.value)
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      marginTop: "6px",
                      border:
                        "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div>
                  <label>
                    Height (px)
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={height}
                    onChange={(e) =>
                      changeHeight(
                        Number(e.target.value)
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      marginTop: "6px",
                      border:
                        "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "16px",
                    }}
                  />
                </div>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "20px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={keepRatio}
                  onChange={(e) =>
                    setKeepRatio(
                      e.target.checked
                    )
                  }
                />

                Keep aspect ratio
              </label>
            </div>

            <div
              style={{
                textAlign: "center",
              }}
            >
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
            <h2>
              Resized Preview
            </h2>

            <p style={{ color: "#666" }}>
              {width} × {height}px
            </p>

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