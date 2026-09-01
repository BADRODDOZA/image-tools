"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

export default function JpgToPdfPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

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

  const convertToPdf = async (imageData: string) => {
    try {
      const { jsPDF } = await import("jspdf");

      const img = new Image();

      img.onload = () => {
        const pdf = new jsPDF({
          orientation:
            img.width > img.height
              ? "landscape"
              : "portrait",
          unit: "px",
          format: [img.width, img.height],
        });

        pdf.addImage(
          imageData,
          "JPEG",
          0,
          0,
          img.width,
          img.height
        );

        const pdfBlob = pdf.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);

        setResult(pdfUrl);
        setShowCropper(false);
      };

      img.src = imageData;
    } catch (error) {
      console.error("PDF conversion error:", error);
    }
  };

  const handleCrop = (croppedImage: string) => {
    setImage(croppedImage);
    setShowCropper(false);

    convertToPdf(croppedImage);
  };

  const downloadResult = () => {
    if (!result) return;

    const link = document.createElement("a");

    link.href = result;
    link.download = "image.pdf";

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
        📄 JPG to PDF
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: "30px",
        }}
      >
        Convert JPG images to PDF and crop them before
        creating your PDF.
      </p>

      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/jpg"
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
                🖼️ Original JPG
              </h2>

              <img
                src={image}
                alt="Original JPG"
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
                  marginBottom: "15px",
                }}
              >
                ✂️ Crop Image
              </button>

              <button
                onClick={() => convertToPdf(image)}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                📄 Convert to PDF
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
                ✅ PDF Ready
              </h2>

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
                📥 Download PDF
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}