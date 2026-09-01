"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

export default function PdfToPngPage() {
  const [image, setImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [fileName, setFileName] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please select a PDF file.");
      return;
    }

    setFileName(file.name);

    alert(
      "PDF selected successfully. Your existing PDF rendering can be connected to the crop tool."
    );
  };

  const handleCrop = (croppedImage: string) => {
    setImage(croppedImage);
    setShowCropper(false);
  };

  const downloadPng = () => {
    if (!image) {
      alert("Please create a page preview first.");
      return;
    }

    const link = document.createElement("a");

    link.href = image;
    link.download = "pdf-page.png";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setImage(null);
    setShowCropper(false);
    setFileName("");
    setPageNumber(1);
  };

  return (
    <main
      style={{
        maxWidth: "750px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "35px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        {/* Heading */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              fontSize: "55px",
              marginBottom: "10px",
            }}
          >
            🖼️
          </div>

          <h1
            style={{
              margin: 0,
              color: "#1e3a8a",
              fontSize: "36px",
            }}
          >
            PDF to PNG
          </h1>

          <p
            style={{
              color: "#666",
              fontSize: "17px",
              lineHeight: "1.6",
            }}
          >
            Convert PDF pages to PNG and crop the page
            before downloading.
          </p>
        </div>

        {/* Upload */}

        {!fileName && (
          <label
            style={{
              display: "block",
              border: "2px dashed #16a34a",
              borderRadius: "16px",
              padding: "45px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: "#f0fdf4",
            }}
          >
            <div
              style={{
                fontSize: "45px",
                marginBottom: "10px",
              }}
            >
              📤
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                color: "#166534",
              }}
            >
              Choose a PDF
            </h2>

            <p
              style={{
                color: "#666",
                margin: 0,
              }}
            >
              Select a PDF file from your computer
            </p>

            <input
              type="file"
              accept="application/pdf"
              onChange={handleFile}
              style={{
                display: "none",
              }}
            />
          </label>
        )}

        {/* PDF selected */}

        {fileName && (
          <>
            {/* Information */}

            <div
              style={{
                background: "#f8fafc",
                borderRadius: "14px",
                padding: "18px",
                marginBottom: "25px",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  color: "#1e3a8a",
                }}
              >
                📄 PDF Information
              </h3>

              <p>
                <strong>File:</strong> {fileName}
              </p>

              <p
                style={{
                  marginBottom: 0,
                }}
              >
                <strong>Page:</strong> {pageNumber}
              </p>
            </div>

            {/* Page preview */}

            {image && !showCropper && (
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "25px",
                }}
              >
                <h3
                  style={{
                    color: "#1e3a8a",
                  }}
                >
                  🖼️ Page Preview
                </h3>

                <img
                  src={image}
                  alt="PDF page preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "400px",
                    borderRadius: "12px",
                    boxShadow:
                      "0 5px 20px rgba(0,0,0,0.12)",
                  }}
                />
              </div>
            )}

            {/* PDF rendering notice */}

            {!image && (
              <div
                style={{
                  padding: "30px 20px",
                  background: "#fff7ed",
                  borderRadius: "12px",
                  textAlign: "center",
                  color: "#9a3412",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "40px",
                  }}
                >
                  ⚠️
                </div>

                <h3>
                  PDF page preview is not connected yet
                </h3>

                <p>
                  Your existing PDF-to-PNG rendering code
                  needs to provide the page image before
                  cropping can be enabled.
                </p>
              </div>
            )}

            {/* Crop */}

            {image && !showCropper && (
              <button
                onClick={() => setShowCropper(true)}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginBottom: "15px",
                }}
              >
                ✂️ Crop Image
              </button>
            )}

            {/* Cropper */}

            {showCropper && image && (
              <ImageCropper
                image={image}
                onCrop={handleCrop}
                onCancel={() => setShowCropper(false)}
              />
            )}

            {/* Download */}

            {image && !showCropper && (
              <button
                onClick={downloadPng}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "17px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginBottom: "12px",
                }}
              >
                🖼️ Download PNG
              </button>
            )}

            {/* Reset */}

            <button
              onClick={reset}
              style={{
                width: "100%",
                padding: "13px",
                background: "#f1f5f9",
                color: "#333",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              🔄 Choose Another PDF
            </button>
          </>
        )}
      </div>

      {/* Privacy */}

      <div
        style={{
          marginTop: "25px",
          padding: "20px",
          background: "#eff6ff",
          borderRadius: "14px",
          color: "#334155",
          lineHeight: "1.6",
        }}
      >
        <strong>🔒 Privacy:</strong> Your files are processed
        directly in your browser whenever possible.
      </div>
    </main>
  );
}