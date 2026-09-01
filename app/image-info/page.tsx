"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

export default function ImageInfoPage() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileType, setFileType] = useState("");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [showCropper, setShowCropper] = useState(false);

  const updateImageInfo = (imageData: string) => {
    setImage(imageData);

    const img = new Image();

    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);
    };

    img.src = imageData;
  };

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setFileType(file.type);
    setShowCropper(false);

    const sizeKB = file.size / 1024;

    if (sizeKB < 1024) {
      setFileSize(sizeKB.toFixed(2) + " KB");
    } else {
      setFileSize(
        (sizeKB / 1024).toFixed(2) + " MB"
      );
    }

    const reader = new FileReader();

    reader.onload = () => {
      updateImageInfo(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleCrop = (croppedImage: string) => {
    setShowCropper(false);

    updateImageInfo(croppedImage);

    setFileType("image/png");

    const baseName = fileName
      ? fileName.replace(/\.[^/.]+$/, "")
      : "image";

    setFileName(baseName + "-cropped.png");

    setFileSize("Cropped image");
  };

  return (
    <main
      style={{
        maxWidth: "800px",
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
        🔍 Image Information
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: "30px",
        }}
      >
        Upload an image to view its file information and
        dimensions.
      </p>

      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
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
            marginTop: "30px",
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
              <img
                src={image}
                alt="Preview"
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "400px",
                  margin: "0 auto 20px",
                  borderRadius: "12px",
                }}
              />

              <button
                onClick={() => setShowCropper(true)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "14px",
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "17px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginBottom: "30px",
                }}
              >
                ✂️ Crop Image
              </button>

              <h2
                style={{
                  marginBottom: "20px",
                }}
              >
                📋 Image Details
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "15px",
                }}
              >
                <div
                  style={{
                    padding: "15px",
                    background: "#f3f4f6",
                    borderRadius: "10px",
                  }}
                >
                  <strong>📁 File Name:</strong>
                  <br />
                  {fileName}
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#f3f4f6",
                    borderRadius: "10px",
                  }}
                >
                  <strong>📦 File Size:</strong>
                  <br />
                  {fileSize}
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#f3f4f6",
                    borderRadius: "10px",
                  }}
                >
                  <strong>🖼️ File Type:</strong>
                  <br />
                  {fileType}
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#f3f4f6",
                    borderRadius: "10px",
                  }}
                >
                  <strong>📐 Dimensions:</strong>
                  <br />
                  {width} × {height} pixels
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#f3f4f6",
                    borderRadius: "10px",
                  }}
                >
                  <strong>📏 Aspect Ratio:</strong>
                  <br />
                  {width > 0 && height > 0
                    ? (width / height).toFixed(2)
                    : "-"}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}