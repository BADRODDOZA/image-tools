"use client";

import { useState } from "react";

export default function RemoveBackgroundPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setResult(null);
    setProgress("");

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const removeBackground = async () => {
    if (!image) return;

    try {
      setLoading(true);
      setResult(null);
      setProgress("Loading background remover...");

      const module = await import(
        "@imgly/background-removal"
      );

      setProgress(
        "Removing background... The first time may take a few minutes."
      );

      const blob = await module.removeBackground(image);

      const resultUrl = URL.createObjectURL(blob);

      setResult(resultUrl);
      setProgress(
        "Background removed successfully!"
      );
    } catch (error) {
      console.error(
        "Background removal error:",
        error
      );

      setProgress(
        "Background removal failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;

    const link = document.createElement("a");

    const newName = fileName
      ? fileName.replace(/\.[^/.]+$/, "")
      : "image";

    link.download =
      newName + "-no-background.png";

    link.href = result;

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
        ✨ Remove Background
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: "30px",
        }}
      >
        Automatically remove the background from
        your image.
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
              textAlign: "center",
              color: "#1e3a8a",
            }}
          >
            🖼️ Original Image
          </h2>

          <p
            style={{
              textAlign: "center",
              color: "#666",
            }}
          >
            {fileName}
          </p>

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
            onClick={removeBackground}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              background: loading
                ? "#9ca3af"
                : "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "⏳ Removing Background..."
              : "✨ Remove Background"}
          </button>

          {progress && (
            <p
              style={{
                textAlign: "center",
                marginTop: "20px",
                color: "#555",
              }}
            >
              {progress}
            </p>
          )}

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
                ✅ Background Removed
              </h2>

              <div
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)",
                  backgroundSize: "20px 20px",
                  backgroundPosition:
                    "0 0, 0 10px, 10px -10px, -10px 0px",
                }}
              >
                <img
                  src={result}
                  alt="Background removed"
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: "450px",
                    margin: "0 auto",
                  }}
                />
              </div>

              <button
                onClick={downloadResult}
                style={{
                  width: "100%",
                  marginTop: "20px",
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
                📥 Download Transparent PNG
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}