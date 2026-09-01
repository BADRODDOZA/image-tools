"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

export default function ImageToPdfPage() {
  const [image, setImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);

  const [minimumKB, setMinimumKB] = useState(100);
  const [currentTargetKB, setCurrentTargetKB] = useState(100);
  const [quality, setQuality] = useState(0.95);
  const [pdfSize, setPdfSize] = useState("");

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.");
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(2) + " KB");
    setPdfSize("");
    setQuality(0.95);
    setCurrentTargetKB(minimumKB);

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result as string;

      setImage(imageData);
      setShowCropper(true);

      const img = new Image();

      img.onload = () => {
        setImageWidth(img.width);
        setImageHeight(img.height);
      };

      img.src = imageData;
    };

    reader.readAsDataURL(file);
  };

  const handleCrop = (croppedImage: string) => {
    setImage(croppedImage);
    setShowCropper(false);
    setFileSize("Cropped image");
    setPdfSize("");
    setQuality(0.95);

    const img = new Image();

    img.onload = () => {
      setImageWidth(img.width);
      setImageHeight(img.height);
    };

    img.src = croppedImage;
  };

  function createPdf(
    jpegData: string,
    width: number,
    height: number
  ): Uint8Array | null {
    const parts = jpegData.split(",");

    if (parts.length < 2) return null;

    let binary = "";

    try {
      binary = atob(parts[1]);
    } catch {
      return null;
    }

    const imageBytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      imageBytes[i] = binary.charCodeAt(i);
    }

    const encoder = new TextEncoder();

    const headerBytes = new Uint8Array([
      37,
      80,
      68,
      70,
      45,
      49,
      46,
      52,
      10,
      37,
      255,
      255,
      255,
      255,
      10,
    ]);

    const obj1 =
      "1 0 obj\n" +
      "<< /Type /Catalog /Pages 2 0 R >>\n" +
      "endobj\n";

    const obj2 =
      "2 0 obj\n" +
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n" +
      "endobj\n";

    const obj3 =
      "3 0 obj\n" +
      "<< /Type /Page /Parent 2 0 R " +
      "/MediaBox [0 0 " +
      width +
      " " +
      height +
      "] " +
      "/Resources << /XObject << /Im0 4 0 R >> >> " +
      "/Contents 5 0 R >>\n" +
      "endobj\n";

    const obj4Header =
      "4 0 obj\n" +
      "<< /Type /XObject /Subtype /Image " +
      "/Width " +
      width +
      " /Height " +
      height +
      " /ColorSpace /DeviceRGB " +
      "/BitsPerComponent 8 " +
      "/Filter /DCTDecode " +
      "/Length " +
      imageBytes.length +
      " >>\n" +
      "stream\n";

    const obj4Footer =
      "\nendstream\n" +
      "endobj\n";

    const content =
      "q\n" +
      width +
      " 0 0 " +
      height +
      " 0 0 cm\n" +
      "/Im0 Do\n" +
      "Q\n";

    const contentLength = encoder.encode(content).length;

    const obj5 =
      "5 0 obj\n" +
      "<< /Length " +
      contentLength +
      " >>\n" +
      "stream\n" +
      content +
      "endstream\n" +
      "endobj\n";

    const o1 = encoder.encode(obj1);
    const o2 = encoder.encode(obj2);
    const o3 = encoder.encode(obj3);
    const o4Header = encoder.encode(obj4Header);
    const o4Footer = encoder.encode(obj4Footer);
    const o5 = encoder.encode(obj5);

    const imageObject = new Uint8Array(
      o4Header.length +
        imageBytes.length +
        o4Footer.length
    );

    imageObject.set(o4Header, 0);

    imageObject.set(
      imageBytes,
      o4Header.length
    );

    imageObject.set(
      o4Footer,
      o4Header.length + imageBytes.length
    );

    const objects = [
      o1,
      o2,
      o3,
      imageObject,
      o5,
    ];

    const offsets: number[] = [];

    let currentOffset = headerBytes.length;

    for (const obj of objects) {
      offsets.push(currentOffset);
      currentOffset += obj.length;
    }

    const xrefPosition = currentOffset;

    let xref =
      "xref\n" +
      "0 6\n" +
      "0000000000 65535 f \n";

    for (const offset of offsets) {
      xref +=
        String(offset).padStart(10, "0") +
        " 00000 n \n";
    }

    const trailer =
      "trailer\n" +
      "<< /Size 6 /Root 1 0 R >>\n" +
      "startxref\n" +
      xrefPosition +
      "\n" +
      "%%EOF";

    const xrefBytes = encoder.encode(xref);
    const trailerBytes = encoder.encode(trailer);

    const objectsLength = objects.reduce(
      (total, obj) => total + obj.length,
      0
    );

    const totalSize =
      headerBytes.length +
      objectsLength +
      xrefBytes.length +
      trailerBytes.length;

    const pdf = new Uint8Array(totalSize);

    let position = 0;

    pdf.set(headerBytes, position);
    position += headerBytes.length;

    for (const obj of objects) {
      pdf.set(obj, position);
      position += obj.length;
    }

    pdf.set(xrefBytes, position);
    position += xrefBytes.length;

    pdf.set(trailerBytes, position);

    return pdf;
  }

  const findBestQualityForTarget = (
    targetKB: number
  ) => {
    if (!image) return;

    const img = new Image();

    img.onload = () => {
      const pdfWidth = 595;

      const pdfHeight = Math.round(
        (img.height / img.width) * pdfWidth
      );

      const canvas =
        document.createElement("canvas");

      canvas.width = pdfWidth;
      canvas.height = pdfHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.fillStyle = "#ffffff";

      ctx.fillRect(
        0,
        0,
        pdfWidth,
        pdfHeight
      );

      ctx.drawImage(
        img,
        0,
        0,
        pdfWidth,
        pdfHeight
      );

      let low = 0.05;
      let high = 1;
      let bestPdf: Uint8Array | null = null;
      let bestQuality = 0.05;

      const targetBytes = targetKB * 1024;

      for (let i = 0; i < 12; i++) {
        const testQuality =
          (low + high) / 2;

        const jpegData =
          canvas.toDataURL(
            "image/jpeg",
            testQuality
          );

        const testPdf =
          createPdf(
            jpegData,
            pdfWidth,
            pdfHeight
          );

        if (!testPdf) break;

        if (
          testPdf.length <= targetBytes
        ) {
          bestPdf = testPdf;
          bestQuality = testQuality;
          low = testQuality;
        } else {
          high = testQuality;
        }
      }

      if (!bestPdf) {
        bestPdf = createPdf(
          canvas.toDataURL(
            "image/jpeg",
            0.05
          ),
          pdfWidth,
          pdfHeight
        );

        bestQuality = 0.05;
      }

      if (bestPdf) {
        setQuality(bestQuality);

        setPdfSize(
          (
            bestPdf.length / 1024
          ).toFixed(2) + " KB"
        );
      }
    };

    img.onerror = () => {
      alert("Could not load the image.");
    };

    img.src = image;
  };

  const decreaseKB = () => {
    if (!image) return;

    const newTarget = Math.max(
      minimumKB,
      currentTargetKB - 1
    );

    setCurrentTargetKB(newTarget);

    findBestQualityForTarget(newTarget);
  };

  const increaseKB = () => {
    if (!image) return;

    const newTarget =
      currentTargetKB + 1;

    setCurrentTargetKB(newTarget);

    findBestQualityForTarget(newTarget);
  };

  const handleMinimumKBChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = Number(e.target.value);

    if (value < 1) {
      setMinimumKB(1);
      setCurrentTargetKB(1);
      return;
    }

    setMinimumKB(value);

    if (currentTargetKB < value) {
      setCurrentTargetKB(value);
    }
  };

  const convertToPdf = () => {
    if (!image) {
      alert("Please select an image first.");
      return;
    }

    const img = new Image();

    img.onload = () => {
      const pdfWidth = 595;

      const pdfHeight = Math.round(
        (img.height / img.width) *
          pdfWidth
      );

      const canvas =
        document.createElement("canvas");

      canvas.width = pdfWidth;
      canvas.height = pdfHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        alert("Could not create PDF.");
        return;
      }

      ctx.fillStyle = "#ffffff";

      ctx.fillRect(
        0,
        0,
        pdfWidth,
        pdfHeight
      );

      ctx.drawImage(
        img,
        0,
        0,
        pdfWidth,
        pdfHeight
      );

      const jpegData =
        canvas.toDataURL(
          "image/jpeg",
          quality
        );

      const pdf = createPdf(
        jpegData,
        pdfWidth,
        pdfHeight
      );

      if (!pdf) {
        alert("Could not create PDF.");
        return;
      }

      setPdfSize(
        (
          pdf.length / 1024
        ).toFixed(2) + " KB"
      );

      const blob = new Blob(
  [new Uint8Array(pdf)],
  {
    type: "application/pdf",
  }
);

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        "image-to-pdf.pdf";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    };

    img.onerror = () => {
      alert("Could not load the image.");
    };

    img.src = image;
  };

  const resetImage = () => {
    setImage(null);
    setShowCropper(false);
    setFileName("");
    setFileSize("");
    setImageWidth(0);
    setImageHeight(0);
    setMinimumKB(100);
    setCurrentTargetKB(100);
    setQuality(0.95);
    setPdfSize("");
  };

  return (
    <main
      style={{
        maxWidth: "750px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      {showCropper && image && (
        <ImageCropper
          image={image}
          onCrop={handleCrop}
          onCancel={() =>
            setShowCropper(false)
          }
        />
      )}

      <div
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "35px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
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
            📑
          </div>

          <h1
            style={{
              margin: 0,
              color: "#1e3a8a",
              fontSize: "36px",
            }}
          >
            Image to PDF
          </h1>

          <p
            style={{
              color: "#666",
              fontSize: "17px",
            }}
          >
            Convert your image to PDF with
            framing crop and size control.
          </p>
        </div>

        {!image && (
          <label
            style={{
              display: "block",
              border:
                "2px dashed #dc2626",
              borderRadius: "16px",
              padding: "45px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: "#fef2f2",
            }}
          >
            <div
              style={{
                fontSize: "45px",
              }}
            >
              📤
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                color: "#991b1b",
              }}
            >
              Choose an Image
            </h2>

            <p>
              Upload an image and crop it
              using the framing controls.
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              style={{
                display: "none",
              }}
            />
          </label>
        )}

        {image && (
          <>
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "14px",
                padding: "18px",
                marginBottom: "25px",
              }}
            >
              <h3>
                📊 Image Information
              </h3>

              <p>
                <strong>File:</strong>{" "}
                {fileName ||
                  "Cropped image"}
              </p>

              <p>
                <strong>
                  Dimensions:
                </strong>{" "}
                {imageWidth} ×{" "}
                {imageHeight} px
              </p>

              <p>
                <strong>
                  File Size:
                </strong>{" "}
                {fileSize}
              </p>
            </div>

            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <img
                src={image}
                alt="Selected image"
                style={{
                  maxWidth: "100%",
                  maxHeight: "350px",
                  borderRadius: "12px",
                }}
              />
            </div>

            {!showCropper && (
              <button
                onClick={() =>
                  setShowCropper(true)
                }
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginBottom: "20px",
                }}
              >
                ✂️ Crop Image Again
              </button>
            )}

            {!showCropper && (
              <>
                <div
                  style={{
                    background: "#f0fdf4",
                    borderRadius: "14px",
                    padding: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <h3>
                    📦 PDF Size Control
                  </h3>

                  <label>
                    <strong>
                      Minimum KB
                    </strong>
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={minimumKB}
                    onChange={
                      handleMinimumKBChange
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      margin:
                        "8px 0 15px",
                      boxSizing:
                        "border-box",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                    }}
                  >
                    <button
                      onClick={decreaseKB}
                      disabled={
                        currentTargetKB <=
                        minimumKB
                      }
                      style={{
                        flex: 1,
                        padding: "13px",
                        background:
                          currentTargetKB <=
                          minimumKB
                            ? "#94a3b8"
                            : "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "9px",
                        cursor: "pointer",
                      }}
                    >
                      📉 - 1 KB
                    </button>

                    <button
                      onClick={increaseKB}
                      style={{
                        flex: 1,
                        padding: "13px",
                        background:
                          "#16a34a",
                        color: "white",
                        border: "none",
                        borderRadius: "9px",
                        cursor: "pointer",
                      }}
                    >
                      📈 + 1 KB
                    </button>
                  </div>

                  <p>
                    <strong>Target:</strong>{" "}
                    {currentTargetKB} KB
                  </p>

                  <p>
                    <strong>Quality:</strong>{" "}
                    {Math.round(
                      quality * 100
                    )}%
                  </p>

                  {pdfSize && (
                    <p>
                      <strong>
                        Current PDF Size:
                      </strong>{" "}
                      {pdfSize}
                    </p>
                  )}
                </div>

                <button
                  onClick={convertToPdf}
                  style={{
                    width: "100%",
                    padding: "15px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    marginBottom: "12px",
                    cursor: "pointer",
                  }}
                >
                  📄 Convert to PDF &
                  Download
                </button>

                <button
                  onClick={resetImage}
                  style={{
                    width: "100%",
                    padding: "13px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                  }}
                >
                  🔄 Choose Another Image
                </button>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}