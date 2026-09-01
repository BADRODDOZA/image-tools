"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

export default function JpgToWebPPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [quality, setQuality] = useState(0.9);
  const [fileName, setFileName] = useState("");

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (
      file.type !== "image/jpeg" &&
      file.type !== "image/jpg"
    ) {
      alert("Please select a JPG image.");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result as string;

      setImage(imageData);
      setResult(null);

      // Open framing crop automatically
      setShowCropper(true);
    };

    reader.readAsDataURL(file);
  };

  const convertToWebP = (
    imageData: string
  ) => {
    const img = new Image();

    img.onload = () => {
      const canvas =
        document.createElement("canvas");

      const ctx =
        canvas.getContext("2d");

      if (!ctx) {
        alert("Could not process the image.");
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height
      );

      const webp =
        canvas.toDataURL(
          "image/webp",
          quality
        );

      setResult(webp);
      setShowCropper(false);
    };

    img.onerror = () => {
      alert("Could not load the image.");
    };

    img.src = imageData;
  };

  const handleCrop = (
    croppedImage: string
  ) => {
    setImage(croppedImage);
    setShowCropper(false);
    setResult(null);
  };

  const downloadResult = () => {
    if (!result) return;

    const link =
      document.createElement("a");

    const newName = fileName
      ? fileName.replace(
          /\.[^/.]+$/,
          ""
        )
      : "converted-image";

    link.href = result;
    link.download =
      `${newName}.webp`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  const resetImage = () => {
    setImage(null);
    setResult(null);
    setShowCropper(false);
    setFileName("");
    setQuality(0.9);
  };

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "35px",
          borderRadius: "20px",
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
            🌐
          </div>

          <h1
            style={{
              margin: 0,
              color: "#1e3a8a",
              fontSize: "36px",
            }}
          >
            JPG to WebP
          </h1>

          <p
            style={{
              color: "#666",
              fontSize: "17px",
            }}
          >
            Convert JPG images to WebP with
            4-side and 4-corner framing crop.
          </p>
        </div>

        {!image && (
          <label
            style={{
              display: "block",
              border:
                "2px dashed #8b5cf6",
              borderRadius: "16px",
              padding: "45px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: "#f5f3ff",
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
                color: "#6d28d9",
              }}
            >
              Choose a JPG Image
            </h2>

            <p>
              Upload a JPG image and frame
              the area you want to convert.
            </p>

            <input
              type="file"
              accept="image/jpeg,image/jpg"
              onChange={handleFile}
              style={{
                display: "none",
              }}
            />
          </label>
        )}

        {image && (
          <>
            {showCropper && (
              <ImageCropper
                image={image}
                onCrop={handleCrop}
                onCancel={() =>
                  setShowCropper(false)
                }
              />
            )}

            {!showCropper && (
              <>
                <div
                  style={{
                    background:
                      "#f8fafc",
                    borderRadius: "14px",
                    padding: "18px",
                    marginBottom: "25px",
                  }}
                >
                  <h3>
                    📊 Image Information
                  </h3>

                  <p>
                    <strong>
                      File:
                    </strong>{" "}
                    {fileName ||
                      "Cropped image"}
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
                    alt="Selected JPG"
                    style={{
                      display: "block",
                      maxWidth: "100%",
                      maxHeight: "450px",
                      margin: "20px auto",
                      borderRadius: "12px",
                    }}
                  />
                </div>

                <button
                  onClick={() =>
                    setShowCropper(true)
                  }
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
                  ✂️ Crop Image Again
                </button>

                <div
                  style={{
                    background:
                      "#f5f3ff",
                    padding: "20px",
                    borderRadius: "14px",
                    marginBottom: "20px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      marginBottom: "10px",
                    }}
                  >
                    WebP Quality:{" "}
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
                        Number(
                          e.target.value
                        )
                      )
                    }
                    style={{
                      width: "100%",
                    }}
                  />
                </div>

                <button
                  onClick={() =>
                    convertToWebP(image)
                  }
                  style={{
                    width: "100%",
                    padding: "15px",
                    background:
                      "#8b5cf6",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  🌐 Convert to WebP
                </button>

                {result && (
                  <div
                    style={{
                      marginTop: "30px",
                      paddingTop: "25px",
                      borderTop:
                        "1px solid #ddd",
                    }}
                  >
                    <h2
                      style={{
                        textAlign:
                          "center",
                        color:
                          "#16a34a",
                      }}
                    >
                      ✅ WebP Result
                    </h2>

                    <img
                      src={result}
                      alt="WebP result"
                      style={{
                        display:
                          "block",
                        maxWidth:
                          "100%",
                        maxHeight:
                          "450px",
                        margin:
                          "20px auto",
                        borderRadius:
                          "12px",
                      }}
                    />

                    <button
                      onClick={
                        downloadResult
                      }
                      style={{
                        width:
                          "100%",
                        padding:
                          "15px",
                        background:
                          "#16a34a",
                        color:
                          "white",
                        border:
                          "none",
                        borderRadius:
                          "10px",
                        fontSize:
                          "18px",
                        fontWeight:
                          "bold",
                        cursor:
                          "pointer",
                      }}
                    >
                      📥 Download WebP
                    </button>
                  </div>
                )}

                <button
                  onClick={
                    resetImage
                  }
                  style={{
                    width: "100%",
                    padding: "13px",
                    marginTop: "15px",
                    background:
                      "#f1f5f9",
                    border: "none",
                    borderRadius:
                      "10px",
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