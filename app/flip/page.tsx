"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

export default function FlipImagePage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [flipType, setFlipType] = useState<"horizontal" | "vertical">(
    "horizontal"
  );

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

  const flipImage = (
    imageData: string,
    type = flipType
  ) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.save();

      if (type === "horizontal") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
      }

      ctx.drawImage(img, 0, 0);

      ctx.restore();

      const flipped = canvas.toDataURL("image/png");

      setResult(flipped);
      setShowCropper(false);
    };

    img.src = imageData;
  };

  const handleCrop = (croppedImage: string) => {
    setImage(croppedImage);
    setShowCropper(false);

    flipImage(croppedImage);
  };

  const downloadResult = () => {
    if (!result) return;

    const link = document.createElement("a");

    link.href = result;
    link.download = "flipped-image.png";

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
        🔄 Flip Image
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: "30px",
        }}
      >
        Flip your image horizontally or vertically.
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
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                <button
                  onClick={() => {
                    setFlipType("horizontal");
                    flipImage(image, "horizontal");
                  }}
                  style={{
                    padding: "15px",
                    background: "#14b8a6",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ↔️ Flip Horizontal
                </button>

                <button
                  onClick={() => {
                    setFlipType("vertical");
                    flipImage(image, "vertical");
                  }}
                  style={{
                    padding: "15px",
                    background: "#0ea5e9",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ↕️ Flip Vertical
                </button>
              </div>
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
                ✅ Flipped Result
              </h2>

              <img
                src={result}
                alt="Flipped result"
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
                📥 Download Flipped Image
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}