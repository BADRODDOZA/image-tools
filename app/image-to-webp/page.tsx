"use client";

import { useState } from "react";

export default function ImageToWebpPage() {
  const [image, setImage] = useState<string | null>(null);
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [quality, setQuality] = useState(80);
  const [keepRatio, setKeepRatio] = useState(true);
  const [originalWidth, setOriginalWidth] = useState(1200);
  const [originalHeight, setOriginalHeight] = useState(800);
  const [originalSize, setOriginalSize] = useState(0);
  const [outputSize, setOutputSize] = useState(0);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    setOriginalSize(file.size);

    reader.onload = () => {
      const result = reader.result as string;

      setImage(result);
      setConvertedImage(null);
      setOutputSize(0);

      const img = new Image();

      img.onload = () => {
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setWidth(img.width);
        setHeight(img.height);
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  };

  const changeWidth = (value: number) => {
    if (value < 1) return;

    setWidth(value);

    if (keepRatio) {
      const ratio = originalHeight / originalWidth;
      setHeight(Math.round(value * ratio));
    }
  };

  const changeHeight = (value: number) => {
    if (value < 1) return;

    setHeight(value);

    if (keepRatio) {
      const ratio = originalWidth / originalHeight;
      setWidth(Math.round(value * ratio));
    }
  };

  const convertToWebP = () => {
    if (!image) return;

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

      const webpImage = canvas.toDataURL(
        "image/webp",
        quality / 100
      );

      setConvertedImage(webpImage);

      const base64Length =
        webpImage.length -
        webpImage.indexOf(",") -
        1;

      const sizeInBytes =
        (base64Length * 3) / 4;

      setOutputSize(sizeInBytes);
    };

    img.src = image;
  };

  const downloadWebP = () => {
    if (!convertedImage) return;

    const link = document.createElement("a");

    link.download = "converted-image.webp";
    link.href = convertedImage;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetTool = () => {
    setImage(null);
    setConvertedImage(null);
    setOutputSize(0);
    setOriginalSize(0);
    setQuality(80);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <main
      style={{
        maxWidth: "850px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          color: "#1e3a8a",
          fontSize: "36px",
        }}
      >
        🌐 Image to WebP
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "#666",
          fontSize: "18px",
          marginBottom: "30px",
        }}
      >
        Convert images to WebP with quality and size controls.
      </p>

      {!image && (
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "18px",
            textAlign: "center",
            boxShadow:
              "0 8px 25px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              fontSize: "55px",
              marginBottom: "15px",
            }}
          >
            🖼️
          </div>

          <h2>Select an Image</h2>

          <p
            style={{
              color: "#777",
              marginBottom: "25px",
            }}
          >
            JPG, PNG, JPEG, GIF and other image formats
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
          />
        </div>
      )}

      {image && (
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "18px",
            boxShadow:
              "0 8px 25px rgba(0,0,0,0.1)",
          }}
        >
          <h2>⚙️ Image Settings</h2>

          {/* Original information */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                background: "#eff6ff",
                padding: "15px",
                borderRadius: "10px",
                textAlign: "center",
              }}
            >
              <strong>Original Size</strong>
              <p style={{ margin: "5px 0" }}>
                {formatSize(originalSize)}
              </p>
            </div>

            <div
              style={{
                background: "#ecfdf5",
                padding: "15px",
                borderRadius: "10px",
                textAlign: "center",
              }}
            >
              <strong>Dimensions</strong>
              <p style={{ margin: "5px 0" }}>
                {originalWidth} × {originalHeight}
              </p>
            </div>
          </div>

          {/* Width */}

          <label
            style={{
              display: "block",
              marginTop: "25px",
              fontWeight: "bold",
            }}
          >
            📐 Width (pixels)
          </label>

          <input
            type="number"
            value={width}
            onChange={(e) =>
              changeWidth(Number(e.target.value))
            }
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              boxSizing: "border-box",
            }}
          />

          {/* Height */}

          <label
            style={{
              display: "block",
              marginTop: "20px",
              fontWeight: "bold",
            }}
          >
            📏 Height (pixels)
          </label>

          <input
            type="number"
            value={height}
            onChange={(e) =>
              changeHeight(Number(e.target.value))
            }
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              boxSizing: "border-box",
            }}
          />

          {/* Aspect ratio */}

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
                setKeepRatio(e.target.checked)
              }
            />

            🔒 Keep aspect ratio
          </label>

          {/* Quality */}

          <label
            style={{
              display: "block",
              marginTop: "25px",
              fontWeight: "bold",
            }}
          >
            🎚️ WebP Quality: {quality}%
          </label>

          <input
            type="range"
            min="10"
            max="100"
            value={quality}
            onChange={(e) =>
              setQuality(Number(e.target.value))
            }
            style={{
              width: "100%",
              marginTop: "10px",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#777",
              fontSize: "14px",
            }}
          >
            <span>📦 Smaller file</span>
            <span>✨ Better quality</span>
          </div>

          {/* Preview */}

          <h2
            style={{
              marginTop: "30px",
            }}
          >
            👀 Original Preview
          </h2>

          <img
            src={image}
            alt="Original"
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "400px",
              margin: "15px auto",
              borderRadius: "12px",
            }}
          />

          {/* Convert */}

          <button
            onClick={convertToWebP}
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "16px",
              background: "#0f766e",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🌐 Convert to WebP
          </button>

          {/* Result */}

          {convertedImage && (
            <div
              style={{
                marginTop: "30px",
                paddingTop: "25px",
                borderTop: "1px solid #ddd",
              }}
            >
              <h2>✨ WebP Result</h2>

              <img
                src={convertedImage}
                alt="Converted WebP"
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "400px",
                  margin: "15px auto",
                  borderRadius: "12px",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "15px",
                  marginTop: "20px",
                }}
              >
                <div
                  style={{
                    background: "#f0fdf4",
                    padding: "15px",
                    borderRadius: "10px",
                    textAlign: "center",
                  }}
                >
                  <strong>WebP Size</strong>

                  <p
                    style={{
                      margin: "5px 0",
                      color: "#15803d",
                    }}
                  >
                    {formatSize(outputSize)}
                  </p>
                </div>

                <div
                  style={{
                    background: "#eff6ff",
                    padding: "15px",
                    borderRadius: "10px",
                    textAlign: "center",
                  }}
                >
                  <strong>Dimensions</strong>

                  <p style={{ margin: "5px 0" }}>
                    {width} × {height}
                  </p>
                </div>
              </div>

              <button
                onClick={downloadWebP}
                style={{
                  marginTop: "20px",
                  width: "100%",
                  padding: "16px",
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                📥 Download WebP
              </button>
            </div>
          )}

          {/* Reset */}

          <button
            onClick={resetTool}
            style={{
              marginTop: "15px",
              width: "100%",
              padding: "13px",
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            🔄 Start Over
          </button>
        </div>
      )}
    </main>
  );
}