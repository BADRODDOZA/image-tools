"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

type PDFImage = {
  id: string;
  image: string;
  fileName: string;
  width: number;
  height: number;
};

type PDFResult = {
  blob: Blob;
  size: number;
};

function getBlobSize(blob: Blob): number {
  return blob.size;
}

function getBaseName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "");
}

function loadImage(
  src: string
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);

    img.onerror = () => {
      reject(new Error("Could not load image."));
    };

    img.src = src;
  });
}

export default function JpgToPdfPage() {
  const [images, setImages] = useState<PDFImage[]>([]);

  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<
    string | null
  >(null);

  const [result, setResult] = useState<PDFResult | null>(
    null
  );

  const [targetKB, setTargetKB] = useState(500);

  const [pdfSize, setPdfSize] = useState<
    "original" | "a4"
  >("original");

  const [message, setMessage] = useState("");

  const selectedImage = images.find(
    (item) => item.id === selectedImageId
  );

  async function handleFiles(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = e.target.files;

    if (!files || files.length === 0) {
      return;
    }

    const newImages: PDFImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (
        file.type !== "image/jpeg" &&
        file.type !== "image/jpg"
      ) {
        continue;
      }

      const dataUrl = await new Promise<string>(
        (resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            resolve(reader.result as string);
          };

          reader.onerror = () => {
            reject(new Error("Could not read image."));
          };

          reader.readAsDataURL(file);
        }
      );

      try {
        const img = await loadImage(dataUrl);

        newImages.push({
          id: `${Date.now()}-${i}-${Math.random()}`,
          image: dataUrl,
          fileName: file.name,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      } catch {
        // Skip invalid images.
      }
    }

    if (newImages.length === 0) {
      setMessage("Please select valid JPG images.");
      return;
    }

    setImages((previous) => [
      ...previous,
      ...newImages,
    ]);

    setResult(null);
    setMessage("");

    e.target.value = "";
  }

  function removeImage(id: string) {
    setImages((previous) =>
      previous.filter((item) => item.id !== id)
    );

    if (selectedImageId === id) {
      setSelectedImageId(null);
      setShowCropper(false);
    }

    setResult(null);
  }

  function moveImage(
    index: number,
    direction: "up" | "down"
  ) {
    const newImages = [...images];

    if (
      direction === "up" &&
      index > 0
    ) {
      [
        newImages[index - 1],
        newImages[index],
      ] = [
        newImages[index],
        newImages[index - 1],
      ];
    }

    if (
      direction === "down" &&
      index < newImages.length - 1
    ) {
      [
        newImages[index],
        newImages[index + 1],
      ] = [
        newImages[index + 1],
        newImages[index],
      ];
    }

    setImages(newImages);
    setResult(null);
  }

  function openCropper(id: string) {
    setSelectedImageId(id);
    setShowCropper(true);
  }

  async function handleCrop(
    croppedImage: string
  ) {
    if (!selectedImageId) {
      return;
    }

    try {
      const img = await loadImage(croppedImage);

      setImages((previous) =>
        previous.map((item) =>
          item.id === selectedImageId
            ? {
                ...item,
                image: croppedImage,
                width: img.naturalWidth,
                height: img.naturalHeight,
              }
            : item
        )
      );

      setShowCropper(false);
      setSelectedImageId(null);
      setResult(null);
      setMessage("");
    } catch {
      setMessage(
        "Could not process the cropped image."
      );
    }
  }

  function getPageSize(
    imgWidth: number,
    imgHeight: number
  ): {
    width: number;
    height: number;
  } {
    if (pdfSize === "a4") {
      const a4Width = 595.28;
      const a4Height = 841.89;

      const imageRatio =
        imgWidth / imgHeight;

      const pageRatio =
        a4Width / a4Height;

      let width = a4Width;
      let height = a4Height;

      if (imageRatio > pageRatio) {
        width = a4Width;
        height = a4Width / imageRatio;
      } else {
        height = a4Height;
        width = a4Height * imageRatio;
      }

      return {
        width,
        height,
      };
    }

    return {
      width: imgWidth,
      height: imgHeight,
    };
  }

  async function createPDF(
    imageQuality: number
  ): Promise<Blob> {
    const { jsPDF } = await import(
      "jspdf"
    );

    if (images.length === 0) {
      throw new Error(
        "Please select at least one JPG image."
      );
    }

    let pdf: any = null;

    for (let i = 0; i < images.length; i++) {
      const item = images[i];

      const img = await loadImage(
        item.image
      );

      const page = getPageSize(
        img.naturalWidth,
        img.naturalHeight
      );

      if (i === 0) {
        pdf = new jsPDF({
          orientation:
            page.width > page.height
              ? "landscape"
              : "portrait",
          unit: "pt",
          format: [
            page.width,
            page.height,
          ],
          compress: true,
        });
      } else {
        pdf.addPage(
          [page.width, page.height],
          page.width > page.height
            ? "landscape"
            : "portrait"
        );
      }

      const canvas =
        document.createElement("canvas");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) {
        throw new Error(
          "Could not create canvas."
        );
      }

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

      const jpegData =
        canvas.toDataURL(
          "image/jpeg",
          imageQuality
        );

      pdf.addImage(
        jpegData,
        "JPEG",
        0,
        0,
        page.width,
        page.height,
        undefined,
        "FAST"
      );
    }

    const pdfBlob =
      pdf.output("blob");

    return pdfBlob;
  }

  async function convertToPdf() {
    try {
      setMessage(
        "Creating PDF..."
      );

      const blob =
        await createPDF(0.92);

      setResult({
        blob,
        size: blob.size,
      });

      setMessage(
        `PDF created successfully: ${(
          blob.size / 1024
        ).toFixed(1)} KB`
      );
    } catch (error) {
      console.error(
        "PDF conversion error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create PDF."
      );
    }
  }

  async function createPDFForTargetKB(
    requestedKB: number
  ): Promise<PDFResult> {
    const targetBytes =
      requestedKB * 1024;

    let low = 0.05;
    let high = 1;
    let bestBlob: Blob | null = null;
    let bestSize = Infinity;

    for (let i = 0; i < 9; i++) {
      const quality =
        (low + high) / 2;

      const blob =
        await createPDF(quality);

      const size =
        getBlobSize(blob);

      if (size <= targetBytes) {
        bestBlob = blob;
        bestSize = size;

        low = quality;
      } else {
        high = quality;
      }
    }

    if (bestBlob) {
      return {
        blob: bestBlob,
        size: bestSize,
      };
    }

    const smallestBlob =
      await createPDF(0.05);

    return {
      blob: smallestBlob,
      size: smallestBlob.size,
    };
  }

  async function applyTargetKB(
    customTarget?: number
  ) {
    const value =
      customTarget !== undefined
        ? customTarget
        : Number(targetKB);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      setMessage(
        "Please enter a valid KB size."
      );

      return;
    }

    if (images.length === 0) {
      setMessage(
        "Please select JPG images first."
      );

      return;
    }

    setTargetKB(
      Math.round(value)
    );

    setMessage(
      `Creating PDF near ${Math.round(
        value
      )} KB...`
    );

    try {
      const pdf =
        await createPDFForTargetKB(
          value
        );

      setResult(pdf);

      if (
        pdf.size >
        value * 1024
      ) {
        setMessage(
          `The smallest PDF produced is approximately ${(
            pdf.size / 1024
          ).toFixed(
            1
          )} KB. The selected images cannot be reduced to ${Math.round(
            value
          )} KB using JPEG compression alone.`
        );
      } else {
        setMessage(
          `PDF created: ${(
            pdf.size / 1024
          ).toFixed(
            1
          )} KB. Target: ${Math.round(
            value
          )} KB.`
        );
      }
    } catch (error) {
      console.error(
        "Target PDF error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create target-size PDF."
      );
    }
  }

  async function decreaseKB() {
    const newTarget =
      Math.max(
        1,
        Math.round(targetKB) - 1
      );

    setTargetKB(newTarget);

    await applyTargetKB(
      newTarget
    );
  }

  async function increaseKB() {
    const newTarget =
      Math.round(targetKB) + 1;

    setTargetKB(newTarget);

    await applyTargetKB(
      newTarget
    );
  }

  function downloadResult() {
    if (!result) {
      return;
    }

    const url =
      URL.createObjectURL(
        result.blob
      );

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      images.length > 1
        ? "merged-images.pdf"
        : `${getBaseName(
            images[0]?.fileName ||
              "image"
          )}.pdf`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(url);
  }

  function resetAll() {
    setImages([]);
    setResult(null);
    setShowCropper(false);
    setSelectedImageId(null);
    setTargetKB(500);
    setPdfSize("original");
    setMessage("");
  }

  return (
    <main
      style={{
        maxWidth: "950px",
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
        Convert JPG images to PDF, merge multiple
        images, crop images, and control the PDF
        size manually.
      </p>

      <div
        style={{
          textAlign: "center",
          marginBottom: "25px",
        }}
      >
        <label
          style={{
            display: "inline-block",
            padding: "14px 22px",
            background: "#2563eb",
            color: "white",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🖼️ Select JPG Images

          <input
            type="file"
            accept="image/jpeg,image/jpg"
            multiple
            onChange={handleFiles}
            style={{
              display: "none",
            }}
          />
        </label>
      </div>

      {images.length > 0 && (
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
              marginBottom: "20px",
            }}
          >
            🖼️ Selected Images ({images.length})
          </h2>

          {showCropper &&
          selectedImage ? (
            <ImageCropper
              image={
                selectedImage.image
              }
              onCrop={handleCrop}
              onCancel={() => {
                setShowCropper(
                  false
                );
                setSelectedImageId(
                  null
                );
              }}
            />
          ) : (
            <>
              <div>
                {images.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={item.id}
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "12px",
                        padding:
                          "12px",
                        marginBottom:
                          "10px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "10px",
                        background:
                          "#fafafa",
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <img
                        src={
                          item.image
                        }
                        alt={
                          item.fileName
                        }
                        style={{
                          width:
                            "80px",
                          height:
                            "80px",
                          objectFit:
                            "cover",
                          borderRadius:
                            "8px",
                          border:
                            "1px solid #ddd",
                        }}
                      />

                      <div
                        style={{
                          flex:
                            1,
                          minWidth:
                            "180px",
                        }}
                      >
                        <strong>
                          {index +
                            1}
                          .{" "}
                          {
                            item.fileName
                          }
                        </strong>

                        <div
                          style={{
                            color:
                              "#666",
                            fontSize:
                              "13px",
                            marginTop:
                              "5px",
                          }}
                        >
                          {
                            item.width
                          }{" "}
                          ×{" "}
                          {
                            item.height
                          }{" "}
                          px
                        </div>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          gap: "6px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            moveImage(
                              index,
                              "up"
                            )
                          }
                          disabled={
                            index ===
                            0
                          }
                          style={{
                            padding:
                              "8px 11px",
                            border:
                              "1px solid #ccc",
                            borderRadius:
                              "6px",
                            background:
                              "#fff",
                            cursor:
                              index ===
                              0
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            moveImage(
                              index,
                              "down"
                            )
                          }
                          disabled={
                            index ===
                            images.length -
                              1
                          }
                          style={{
                            padding:
                              "8px 11px",
                            border:
                              "1px solid #ccc",
                            borderRadius:
                              "6px",
                            background:
                              "#fff",
                            cursor:
                              index ===
                              images.length -
                                1
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openCropper(
                              item.id
                            )
                          }
                          style={{
                            padding:
                              "8px 12px",
                            border:
                              "none",
                            borderRadius:
                              "6px",
                            background:
                              "#7c3aed",
                            color:
                              "white",
                            cursor:
                              "pointer",
                          }}
                        >
                          ✂️ Crop
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(
                              item.id
                            )
                          }
                          style={{
                            padding:
                              "8px 12px",
                            border:
                              "none",
                            borderRadius:
                              "6px",
                            background:
                              "#dc2626",
                            color:
                              "white",
                            cursor:
                              "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div
                style={{
                  marginTop:
                    "25px",
                  padding:
                    "20px",
                  background:
                    "#f8fafc",
                  borderRadius:
                    "12px",
                }}
              >
                <h3
                  style={{
                    marginBottom:
                      "15px",
                    color:
                      "#1e3a8a",
                  }}
                >
                  📐 PDF Settings
                </h3>

                <label
                  style={{
                    display:
                      "block",
                    fontWeight:
                      "bold",
                    marginBottom:
                      "7px",
                  }}
                >
                  PDF Page Size
                </label>

                <select
                  value={
                    pdfSize
                  }
                  onChange={(
                    e
                  ) => {
                    setPdfSize(
                      e.target
                        .value as
                        | "original"
                        | "a4"
                    );

                    setResult(
                      null
                    );
                  }}
                  style={{
                    width:
                      "100%",
                    padding:
                      "11px",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid #ccc",
                    marginBottom:
                      "20px",
                  }}
                >
                  <option value="original">
                    Original Image Size
                  </option>

                  <option value="a4">
                    A4
                  </option>
                </select>

                <label
                  style={{
                    display:
                      "block",
                    fontWeight:
                      "bold",
                    marginBottom:
                      "7px",
                  }}
                >
                  Target PDF Size (KB)
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    targetKB
                  }
                  onChange={(
                    e
                  ) => {
                    const value =
                      Number(
                        e.target
                          .value
                      );

                    if (
                      Number.isFinite(
                        value
                      ) &&
                      value >
                        0
                    ) {
                      setTargetKB(
                        Math.round(
                          value
                        )
                      );
                    }
                  }}
                  onKeyDown={(
                    e
                  ) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      applyTargetKB();
                    }
                  }}
                  style={{
                    width:
                      "100%",
                    padding:
                      "11px",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid #ccc",
                    marginBottom:
                      "12px",
                  }}
                />

                <div
                  style={{
                    display:
                      "flex",
                    gap:
                      "8px",
                    flexWrap:
                      "wrap",
                    marginBottom:
                      "15px",
                  }}
                >
                  <button
                    type="button"
                    onClick={
                      decreaseKB
                    }
                    style={{
                      padding:
                        "10px 15px",
                      border:
                        "1px solid #ccc",
                      borderRadius:
                        "7px",
                      background:
                        "white",
                      cursor:
                        "pointer",
                    }}
                  >
                    -1 KB
                  </button>

                  <button
                    type="button"
                    onClick={
                      increaseKB
                    }
                    style={{
                      padding:
                        "10px 15px",
                      border:
                        "1px solid #ccc",
                      borderRadius:
                        "7px",
                      background:
                        "white",
                      cursor:
                        "pointer",
                    }}
                  >
                    +1 KB
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyTargetKB()
                    }
                    style={{
                      padding:
                        "10px 18px",
                      border:
                        "none",
                      borderRadius:
                        "7px",
                      background:
                        "#7c3aed",
                      color:
                        "white",
                      fontWeight:
                        "bold",
                      cursor:
                        "pointer",
                    }}
                  >
                    Apply KB Size
                  </button>
                </div>

                <p
                  style={{
                    fontSize:
                      "13px",
                    color:
                      "#666",
                    margin:
                      "0",
                  }}
                >
                  The PDF size will be reduced
                  automatically by adjusting JPEG
                  compression.
                </p>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  gap:
                    "10px",
                  flexWrap:
                    "wrap",
                  marginTop:
                    "20px",
                }}
              >
                <button
                  type="button"
                  onClick={
                    convertToPdf
                  }
                  style={{
                    flex:
                      1,
                    minWidth:
                      "200px",
                    padding:
                      "15px",
                    background:
                      "#dc2626",
                    color:
                      "white",
                    border:
                      "none",
                    borderRadius:
                      "10px",
                    fontSize:
                      "17px",
                    fontWeight:
                      "bold",
                    cursor:
                      "pointer",
                  }}
                >
                  📄 Convert to PDF
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyTargetKB()
                  }
                  style={{
                    flex:
                      1,
                    minWidth:
                      "200px",
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
                      "17px",
                    fontWeight:
                      "bold",
                    cursor:
                      "pointer",
                  }}
                >
                  📦 Create Target KB PDF
                </button>
              </div>

              <div
                style={{
                  marginTop:
                    "12px",
                }}
              >
                <button
                  type="button"
                  onClick={
                    resetAll
                  }
                  style={{
                    width:
                      "100%",
                    padding:
                      "12px",
                    background:
                      "#6b7280",
                    color:
                      "white",
                    border:
                      "none",
                    borderRadius:
                      "10px",
                    fontSize:
                      "16px",
                    cursor:
                      "pointer",
                  }}
                >
                  🔄 Start Again
                </button>
              </div>
            </>
          )}

          {message && (
            <div
              style={{
                marginTop:
                  "20px",
                padding:
                  "12px",
                background:
                  "#eff6ff",
                color:
                  "#1e40af",
                borderRadius:
                  "8px",
                textAlign:
                  "center",
              }}
            >
              {message}
            </div>
          )}

          {result &&
            !showCropper && (
              <div
                style={{
                  marginTop:
                    "30px",
                  paddingTop:
                    "25px",
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
                  ✅ PDF Ready
                </h2>

                <p
                  style={{
                    textAlign:
                      "center",
                    color:
                      "#555",
                    marginTop:
                      "10px",
                    marginBottom:
                      "20px",
                  }}
                >
                  PDF Size:{" "}
                  {(
                    result.size /
                    1024
                  ).toFixed(
                    1
                  )}{" "}
                  KB
                </p>

                <button
                  type="button"
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
                  📥 Download PDF
                </button>
              </div>
            )}
        </div>
      )}
    </main>
  );
}