"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

export default function CropPage() {
  const [image, setImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setCroppedImage(null);

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleCrop = (result: string) => {
    setCroppedImage(result);
  };

  const downloadImage = () => {
    if (!croppedImage) return;

    const link = document.createElement("a");

    link.href = croppedImage;
    link.download = "cropped-image.png";

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
        ✂️ Crop Image
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: "30px",
        }}
      >
        Upload an image, select the area you want, and
        download your cropped image.
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
          <ImageCropper
            image={image}
            onCrop={handleCrop}
            onCancel={() => setImage(null)}
          />
        </div>
      )}

      {croppedImage && (
        <div
          style={{
            marginTop: "30px",
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow:
              "0 8px 25px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: "#1e3a8a",
              marginBottom: "20px",
            }}
          >
            ✅ Cropped Image
          </h2>

          <img
            src={croppedImage}
            alt="Cropped result"
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "500px",
              margin: "0 auto 25px",
              borderRadius: "12px",
            }}
          />

          <button
            onClick={downloadImage}
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
            📥 Download Cropped Image
          </button>
        </div>
      )}
    </main>
  );
}