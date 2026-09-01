"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

export default function CompressPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [quality, setQuality] = useState(0.7);

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
      setResult(null);
      setShowCropper(false);
    };

    reader.readAsDataURL(file);
  };

  const compressImage = (imageData: string) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.drawImage(img, 0, 0);

      const compressed = canvas.toDataURL(
        "image/jpeg",
        quality
      );

      setResult(compressed);
      setShowCropper(false);
    };

    img.src = imageData;
  };

  const handleCrop = (croppedImage: string) => {
    setImage(croppedImage);
    setShowCropper(false);

    compressImage(croppedImage);
  };

  const downloadResult = () => {
    if (!result) return;

    const link = document.createElement("a");

    link.href = result;
    link.download = "compressed-image.jpg";

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
        🗜️ Compress Image
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: "30px",
        }}
      >
        Reduce image file size while keeping good
        image quality.
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
          {showCropper ? (
            <ImageCropper
              image={image}
              onCrop={handleCrop}
              onCancel={() => setShowCropper(false)}
            />
          ) : (
            <>
              <h2
                style={{
                  textAlign: "center",
                  color: "#1e3a8a",
                }}
              >
                🖼️ Original Image
              </h2>

              <img
                src={image}
                alt="Original"
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "450px",
                  margin: "20px auto",
                  borderRadius: "12px",
                }}
              />

              <button
                onClick={() => setShowCropper(true)}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginBottom: "20px",
                }}
              >
                ✂️ Crop Image
              </button>

              <div
                style={{
                  marginBottom: "25px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontWeight: "bold",
                    marginBottom: "10px",
                  }}
                >
                  Compression Quality:{" "}
                  {Math.round(quality * 100)}%
                </label>

                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) =>
                    setQuality(
                      Number(e.target.value)
                    )
                  }
                  style={{
                    width: "100%",
                  }}
                />
              </div>

              <button
                onClick={() => compressImage(image)}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                🗜️ Compress Image
              </button>
            </>
          )}

          {result && !showCropper && (
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
                ✅ Compressed Result
              </h2>

              <img
                src={result}
                alt="Compressed result"
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
                📥 Download Compressed JPG
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}