"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

export default function PngToPdfPage() {
  const [image, setImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type !== "image/png") {
      alert("Please select a PNG image.");
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(2) + " KB");

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result as string;

      setImage(imageData);

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

    const img = new Image();

    img.onload = () => {
      setImageWidth(img.width);
      setImageHeight(img.height);
    };

    img.src = croppedImage;
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
        (img.height / img.width) * pdfWidth
      );

      const canvas = document.createElement("canvas");

      canvas.width = pdfWidth;
      canvas.height = pdfHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        alert("Could not process the image.");
        return;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pdfWidth, pdfHeight);

      ctx.drawImage(
        img,
        0,
        0,
        pdfWidth,
        pdfHeight
      );

      const imageData = canvas.toDataURL(
        "image/jpeg",
        0.95
      );

      const base64 = imageData.split(",")[1];

      if (!base64) {
        alert("Could not create PDF.");
        return;
      }

      const binary = atob(base64);

      const imageBytes = new Uint8Array(
        binary.length
      );

      for (let i = 0; i < binary.length; i++) {
        imageBytes[i] = binary.charCodeAt(i);
      }

      const encoder = new TextEncoder();

      const header = encoder.encode(
        "%PDF-1.4\n%\xFF\xFF\xFF\xFF\n"
      );

      const object1 = encoder.encode(
        "1 0 obj\n" +
          "<< /Type /Catalog /Pages 2 0 R >>\n" +
          "endobj\n"
      );

      const object2 = encoder.encode(
        "2 0 obj\n" +
          "<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n" +
          "endobj\n"
      );

      const object3 = encoder.encode(
        `3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${pdfWidth} ${pdfHeight}]
/Resources <<
/XObject <<
/Im0 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj
`
      );

      const imageHeader = encoder.encode(
        `4 0 obj
<<
/Type /XObject
/Subtype /Image
/Width ${pdfWidth}
/Height ${pdfHeight}
/ColorSpace /DeviceRGB
/BitsPerComponent 8
/Filter /DCTDecode
/Length ${imageBytes.length}
>>
stream
`
      );

      const imageFooter = encoder.encode(
        "\nendstream\nendobj\n"
      );

      const imageObject = new Uint8Array(
        imageHeader.length +
          imageBytes.length +
          imageFooter.length
      );

      imageObject.set(imageHeader, 0);

      imageObject.set(
        imageBytes,
        imageHeader.length
      );

      imageObject.set(
        imageFooter,
        imageHeader.length +
          imageBytes.length
      );

      const contentText = `q
${pdfWidth} 0 0 ${pdfHeight} 0 0 cm
/Im0 Do
Q
`;

      const contentBytes = encoder.encode(
        contentText
      );

      const object5 = encoder.encode(
        `5 0 obj
<< /Length ${contentBytes.length} >>
stream
${contentText}endstream
endobj
`
      );

      const objects = [
        header,
        object1,
        object2,
        object3,
        imageObject,
        object5,
      ];

      const offsets: number[] = [];

      let currentOffset = 0;

      for (const object of objects) {
        offsets.push(currentOffset);
        currentOffset += object.length;
      }

      const xrefPosition = currentOffset;

      let xrefText =
        "xref\n" +
        "0 6\n" +
        "0000000000 65535 f \n";

      for (const offset of offsets) {
        xrefText +=
          String(offset).padStart(10, "0") +
          " 00000 n \n";
      }

      const xref = encoder.encode(xrefText);

      const trailer = encoder.encode(
        `trailer
<< /Size 6 /Root 1 0 R >>
startxref
${xrefPosition}
%%EOF`
      );

      const totalSize =
        objects.reduce(
          (total, object) => total + object.length,
          0
        ) +
        xref.length +
        trailer.length;

      const pdf = new Uint8Array(totalSize);

      let offset = 0;

      for (const object of objects) {
        pdf.set(object, offset);
        offset += object.length;
      }

      pdf.set(xref, offset);
      offset += xref.length;

      pdf.set(trailer, offset);

      const blob = new Blob([pdf], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "converted-image.pdf";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
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
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
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
            📄
          </div>

          <h1
            style={{
              margin: 0,
              color: "#1e3a8a",
              fontSize: "36px",
            }}
          >
            PNG to PDF
          </h1>

          <p
            style={{
              color: "#666",
              fontSize: "17px",
              lineHeight: "1.6",
            }}
          >
            Convert your PNG image to a PDF file with
            optional cropping.
          </p>
        </div>

        {/* Upload */}

        {!image && (
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
              Choose a PNG Image
            </h2>

            <p
              style={{
                color: "#666",
                margin: 0,
              }}
            >
              Select a PNG image from your computer
            </p>

            <input
              type="file"
              accept="image/png"
              onChange={handleFile}
              style={{
                display: "none",
              }}
            />
          </label>
        )}

        {/* Image */}

        {image && (
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
                📊 Image Information
              </h3>

              <p>
                <strong>File:</strong>{" "}
                {fileName || "Cropped image"}
              </p>

              <p>
                <strong>Dimensions:</strong>{" "}
                {imageWidth} × {imageHeight} px
              </p>

              <p
                style={{
                  marginBottom: 0,
                }}
              >
                <strong>File Size:</strong>{" "}
                {fileSize}
              </p>
            </div>

            {/* Preview */}

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
                🖼️ Preview
              </h3>

              <img
                src={image}
                alt="PNG preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "350px",
                  borderRadius: "12px",
                  boxShadow:
                    "0 5px 20px rgba(0,0,0,0.12)",
                }}
              />
            </div>

            {/* Crop button */}

            {!showCropper && (
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

            {showCropper && (
              <ImageCropper
                image={image}
                onCrop={handleCrop}
                onCancel={() =>
                  setShowCropper(false)
                }
              />
            )}

            {/* Convert */}

            {!showCropper && (
              <>
                <button
                  onClick={convertToPdf}
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
                  📄 Convert to PDF & Download
                </button>

                <button
                  onClick={resetImage}
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
                  🔄 Choose Another Image
                </button>
              </>
            )}
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
        <strong>🔒 Privacy:</strong> Your image is
        processed directly in your browser. It does not
        need to be uploaded to our server.
      </div>
    </main>
  );
}