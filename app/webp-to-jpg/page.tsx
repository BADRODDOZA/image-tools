"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

export default function WebPToJpgPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [quality, setQuality] = useState(0.95);

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.includes("webp")) {
      alert("Please select a WebP image.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
      setResult(null);
    };

    reader.readAsDataURL(file);
  };

  const convertToJpg = (
    imageData: string
  ) => {
    const img = new Image();

    img.onload = () => {
      const canvas =
        document.createElement("canvas");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) {
        alert("Your browser does not support canvas.");
        return;
      }

      /*
       * White background
       *
       * This prevents transparent WebP images
       * from becoming black when converted to JPG.
       */
      ctx.fillStyle = "#ffffff";

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const jpgData =
        canvas.toDataURL(
          "image/jpeg",
          quality
        );

      setResult(jpgData);
    };

    img.src = imageData;
  };

  const handleConvert = () => {
    if (!image) {
      alert("Please select a WebP image first.");
      return;
    }

    convertToJpg(image);
  };

  const handleCrop = (
    croppedImage: string
  ) => {
    setImage(croppedImage);
    setShowCropper(false);

    /*
     * Automatically convert the cropped image
     * to JPG after cropping.
     */
    convertToJpg(croppedImage);
  };

  const downloadImage = () => {
    if (!result) return;

    const link =
      document.createElement("a");

    link.href = result;
    link.download =
      "converted-image.jpg";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background:
          "linear-gradient(135deg, #eef4ff, #f8fbff)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          background: "white",
          padding: "30px",
          borderRadius: "18px",
          boxShadow:
            "0 10px 35px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "32px",
            marginBottom: "10px",
            color: "#111827",
          }}
        >
          WebP to JPG Converter
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            marginBottom: "30px",
          }}
        >
          Convert WebP images to JPG quickly
          and easily.
        </p>

        {/* FILE INPUT */}

        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
              color: "#334155",
            }}
          >
            Select WebP Image
          </label>

          <input
            type="file"
            accept="image/webp,.webp"
            onChange={handleFile}
            style={{
              width: "100%",
              padding: "12px",
              border:
                "2px dashed #cbd5e1",
              borderRadius: "10px",
              boxSizing: "border-box",
              cursor: "pointer",
            }}
          />
        </div>

        {/* PREVIEW */}

        {image && (
          <div
            style={{
              marginTop: "20px",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                color: "#1e293b",
                marginBottom: "12px",
              }}
            >
              Image Preview
            </h2>

            <div
              style={{
                background: "#f8fafc",
                padding: "15px",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <img
                src={image}
                alt="Selected WebP"
                style={{
                  maxWidth: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
            </div>

            {/* CROP BUTTON */}

            <button
              onClick={() =>
                setShowCropper(true)
              }
              style={{
                width: "100%",
                marginTop: "15px",
                padding: "14px",
                background: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "9px",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              ✂️ Frame / Crop Image
            </button>
          </div>
        )}

        {/* CROPPER */}

        {showCropper && image && (
          <div
            style={{
              marginTop: "25px",
            }}
          >
            <ImageCropper
              image={image}
              onCrop={handleCrop}
              onCancel={() =>
                setShowCropper(false)
              }
            />
          </div>
        )}

        {/* QUALITY */}

        {image && !showCropper && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              background: "#f8fafc",
              borderRadius: "12px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "10px",
                color: "#334155",
              }}
            >
              JPG Quality:{" "}
              {Math.round(
                quality * 100
              )}
              %
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
        )}

        {/* CONVERT BUTTON */}

        {image && !showCropper && (
          <button
            onClick={handleConvert}
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "15px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "17px",
              cursor: "pointer",
            }}
          >
            🔄 Convert to JPG
          </button>
        )}

        {/* RESULT */}

        {result && !showCropper && (
          <div
            style={{
              marginTop: "30px",
              padding: "20px",
              background: "#f0fdf4",
              borderRadius: "12px",
              border:
                "1px solid #bbf7d0",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                color: "#166534",
                marginBottom: "15px",
              }}
            >
              ✅ Conversion Complete
            </h2>

            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <img
                src={result}
                alt="Converted JPG"
                style={{
                  maxWidth: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                  borderRadius: "8px",
                  background: "white",
                }}
              />
            </div>

            <button
              onClick={downloadImage}
              style={{
                width: "100%",
                padding: "15px",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "17px",
                cursor: "pointer",
              }}
            >
              ⬇️ Download JPG
            </button>
          </div>
        )}
      </div>
    </main>
  );
}