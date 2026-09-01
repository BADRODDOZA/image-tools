"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

export default function ImageToJpgPage() {
  const [image, setImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const [fileName, setFileName] = useState("");
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [originalSize, setOriginalSize] = useState(0);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [targetKB, setTargetKB] = useState(100);
  const [quality, setQuality] = useState(0.92);

  const [result, setResult] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [message, setMessage] = useState("");

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
    setOriginalSize(file.size);

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result as string;

      setImage(imageData);
      setResult(null);
      setResultSize(0);
      setMessage("");

      // Open framing crop automatically
      setShowCropper(true);

      const img = new Image();

      img.onload = () => {
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);

        setWidth(img.width);
        setHeight(img.height);
      };

      img.src = imageData;
    };

    reader.readAsDataURL(file);
  };

  const handleCrop = (
    croppedImage: string
  ) => {
    setImage(croppedImage);
    setShowCropper(false);

    setResult(null);
    setResultSize(0);
    setMessage("");

    const img = new Image();

    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);
    };

    img.src = croppedImage;
  };

  const createJpg = (
    requestedQuality: number,
    requestedWidth: number,
    requestedHeight: number
  ) => {
    return new Promise<{
      dataUrl: string;
      size: number;
    }>((resolve) => {
      if (!image) return;

      const img = new Image();

      img.onload = () => {
        const canvas =
          document.createElement("canvas");

        canvas.width = requestedWidth;
        canvas.height = requestedHeight;

        const ctx =
          canvas.getContext("2d");

        if (!ctx) return;

        // JPG does not support transparency.
        // Use white background.
        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
          0,
          0,
          requestedWidth,
          requestedHeight
        );

        ctx.drawImage(
          img,
          0,
          0,
          requestedWidth,
          requestedHeight
        );

        const dataUrl =
          canvas.toDataURL(
            "image/jpeg",
            requestedQuality
          );

        const base64 =
          dataUrl.split(",")[1];

        const size = Math.round(
          (base64.length * 3) / 4
        );

        resolve({
          dataUrl,
          size,
        });
      };

      img.src = image;
    });
  };

  const convertNormal = async () => {
    if (!image) return;

    setMessage("Creating JPG...");

    const converted =
      await createJpg(
        quality,
        width,
        height
      );

    setResult(converted.dataUrl);
    setResultSize(converted.size);

    setMessage(
      "✅ JPG created successfully!"
    );
  };

  const reduceToTarget = async () => {
    if (!image) return;

    setMessage(
      `Trying to create a JPG close to ${targetKB} KB...`
    );

    const targetBytes =
      targetKB * 1024;

    let low = 0.05;
    let high = 0.98;

    let bestResult:
      | {
          dataUrl: string;
          size: number;
        }
      | null = null;

    for (let i = 0; i < 8; i++) {
      const currentQuality =
        (low + high) / 2;

      const currentResult =
        await createJpg(
          currentQuality,
          width,
          height
        );

      bestResult = currentResult;

      if (
        currentResult.size >
        targetBytes
      ) {
        high = currentQuality;
      } else {
        low = currentQuality;
      }
    }

    if (!bestResult) return;

    setResult(bestResult.dataUrl);
    setResultSize(bestResult.size);

    setMessage(
      `✅ JPG created: approximately ${(
        bestResult.size / 1024
      ).toFixed(1)} KB`
    );
  };

  const increaseToTarget = async () => {
    if (!image) return;

    setMessage(
      `Trying to create a JPG close to ${targetKB} KB...`
    );

    const targetBytes =
      targetKB * 1024;

    let testWidth = width;
    let testHeight = height;

    let bestResult:
      | {
          dataUrl: string;
          size: number;
        }
      | null = null;

    for (let i = 0; i < 8; i++) {
      const currentResult =
        await createJpg(
          1,
          testWidth,
          testHeight
        );

      bestResult = currentResult;

      if (
        currentResult.size >=
        targetBytes
      ) {
        break;
      }

      testWidth = Math.round(
        testWidth * 1.25
      );

      testHeight = Math.round(
        testHeight * 1.25
      );
    }

    if (!bestResult) return;

    setResult(bestResult.dataUrl);
    setResultSize(bestResult.size);

    setMessage(
      `✅ JPG created: approximately ${(
        bestResult.size / 1024
      ).toFixed(1)} KB`
    );
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

    link.download =
      `${newName}.jpg`;

    link.href = result;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  const resetImage = () => {
    setImage(null);
    setShowCropper(false);

    setFileName("");

    setOriginalWidth(0);
    setOriginalHeight(0);
    setOriginalSize(0);

    setWidth(0);
    setHeight(0);

    setTargetKB(100);
    setQuality(0.92);

    setResult(null);
    setResultSize(0);
    setMessage("");
  };

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      {showCropper &&
        image && (
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
            🖼️
          </div>

          <h1
            style={{
              margin: 0,
              color: "#1e3a8a",
              fontSize: "36px",
            }}
          >
            Image to JPG / JPEG
          </h1>

          <p
            style={{
              color: "#666",
              fontSize: "17px",
            }}
          >
            Convert your image to JPG with
            framing crop and size control.
          </p>
        </div>

        {!image && (
          <label
            style={{
              display: "block",
              border:
                "2px dashed #2563eb",
              borderRadius: "16px",
              padding:
                "45px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: "#eff6ff",
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
                margin:
                  "0 0 8px",
                color: "#1e40af",
              }}
            >
              Choose an Image
            </h2>

            <p>
              Upload an image and
              crop it using the
              framing controls.
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
                background:
                  "#f8fafc",
                borderRadius: "14px",
                padding: "18px",
                marginBottom:
                  "25px",
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

              <p>
                <strong>
                  Original Dimensions:
                </strong>{" "}
                {originalWidth} ×{" "}
                {originalHeight} px
              </p>

              <p>
                <strong>
                  Current Dimensions:
                </strong>{" "}
                {width} × {height} px
              </p>

              <p>
                <strong>
                  Original File Size:
                </strong>{" "}
                {(originalSize /
                  1024).toFixed(2)}{" "}
                KB
              </p>
            </div>

            {!showCropper && (
              <>
                <div
                  style={{
                    textAlign:
                      "center",
                    marginBottom:
                      "20px",
                  }}
                >
                  <img
                    src={image}
                    alt="Selected image"
                    style={{
                      maxWidth:
                        "100%",
                      maxHeight:
                        "350px",
                      borderRadius:
                        "12px",
                    }}
                  />
                </div>

                <button
                  onClick={() =>
                    setShowCropper(
                      true
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "14px",
                    background:
                      "#7c3aed",
                    color: "white",
                    border: "none",
                    borderRadius:
                      "10px",
                    fontWeight:
                      "bold",
                    cursor:
                      "pointer",
                    marginBottom:
                      "20px",
                  }}
                >
                  ✂️ Crop Image Again
                </button>

                <div
                  style={{
                    padding: "20px",
                    background:
                      "#f5f7fb",
                    borderRadius:
                      "10px",
                    marginTop:
                      "20px",
                  }}
                >
                  <h2>
                    📐 Resize Image
                  </h2>

                  <p>
                    Current:{" "}
                    {width} ×{" "}
                    {height} px
                  </p>

                  <label>
                    Width:
                    <input
                      type="number"
                      min="1"
                      value={width}
                      onChange={(
                        e
                      ) =>
                        setWidth(
                          Number(
                            e.target
                              .value
                          )
                        )
                      }
                      style={{
                        width:
                          "100%",
                        padding:
                          "10px",
                        marginTop:
                          "5px",
                        marginBottom:
                          "15px",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <label>
                    Height:
                    <input
                      type="number"
                      min="1"
                      value={height}
                      onChange={(
                        e
                      ) =>
                        setHeight(
                          Number(
                            e.target
                              .value
                          )
                        )
                      }
                      style={{
                        width:
                          "100%",
                        padding:
                          "10px",
                        marginTop:
                          "5px",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>
                </div>

                <div
                  style={{
                    padding: "20px",
                    background:
                      "#f5f7fb",
                    borderRadius:
                      "10px",
                    marginTop:
                      "20px",
                  }}
                >
                  <h2>
                    🎯 Target File
                    Size
                  </h2>

                  <label>
                    Target size in KB:

                    <input
                      type="number"
                      min="1"
                      value={targetKB}
                      onChange={(
                        e
                      ) =>
                        setTargetKB(
                          Number(
                            e.target
                              .value
                          )
                        )
                      }
                      style={{
                        width:
                          "100%",
                        padding:
                          "10px",
                        marginTop:
                          "5px",
                        boxSizing:
                          "border-box",
                      }}
                    />
                  </label>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: "10px",
                      marginTop:
                        "20px",
                    }}
                  >
                    <button
                      onClick={
                        reduceToTarget
                      }
                      style={{
                        padding:
                          "14px",
                        background:
                          "#dc2626",
                        color:
                          "white",
                        border:
                          "none",
                        borderRadius:
                          "8px",
                        fontWeight:
                          "bold",
                        cursor:
                          "pointer",
                      }}
                    >
                      📉 Reduce
                      to KB
                    </button>

                    <button
                      onClick={
                        increaseToTarget
                      }
                      style={{
                        padding:
                          "14px",
                        background:
                          "#16a34a",
                        color:
                          "white",
                        border:
                          "none",
                        borderRadius:
                          "8px",
                        fontWeight:
                          "bold",
                        cursor:
                          "pointer",
                      }}
                    >
                      📈 Increase
                      to KB
                    </button>
                  </div>
                </div>

                <button
                  onClick={
                    convertNormal
                  }
                  style={{
                    width:
                      "100%",
                    padding:
                      "16px",
                    marginTop:
                      "20px",
                    background:
                      "#2563eb",
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
                  🔄 Convert to
                  JPG / JPEG
                </button>

                {message && (
                  <p
                    style={{
                      textAlign:
                        "center",
                      marginTop:
                        "20px",
                      fontWeight:
                        "bold",
                    }}
                  >
                    {message}
                  </p>
                )}

                {result && (
                  <div
                    style={{
                      marginTop:
                        "30px",
                      paddingTop:
                        "25px",
                      borderTop:
                        "1px solid #ddd",
                      textAlign:
                        "center",
                    }}
                  >
                    <h2>
                      ✨ JPG Result
                    </h2>

                    <p>
                      Output size:{" "}
                      <strong>
                        {(
                          resultSize /
                          1024
                        ).toFixed(
                          1
                        )}{" "}
                        KB
                      </strong>
                    </p>

                    <img
                      src={result}
                      alt="JPG result"
                      style={{
                        display:
                          "block",
                        maxWidth:
                          "100%",
                        maxHeight:
                          "400px",
                        margin:
                          "20px auto",
                        borderRadius:
                          "10px",
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
                          "16px",
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
                      📥 Download JPG
                    </button>
                  </div>
                )}

                <button
                  onClick={
                    resetImage
                  }
                  style={{
                    width:
                      "100%",
                    padding:
                      "13px",
                    background:
                      "#f1f5f9",
                    border:
                      "none",
                    borderRadius:
                      "10px",
                    cursor:
                      "pointer",
                    marginTop:
                      "12px",
                  }}
                >
                  🔄 Choose Another
                  Image
                </button>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}