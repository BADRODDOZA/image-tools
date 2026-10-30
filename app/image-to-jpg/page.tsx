"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

type MergeImage = {
  id: string;
  image: string;
  fileName: string;
  width: number;
  height: number;
  originalSize: number;
};

type JPGResult = {
  dataUrl: string;
  size: number;
  quality: number;
};

function getDataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] || "";

  const padding = base64.endsWith("==")
    ? 2
    : base64.endsWith("=")
      ? 1
      : 0;

  return Math.floor((base64.length * 3) / 4) - padding;
}

function getFileNameWithoutExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "");
}

export default function ImageToJPGPage() {
  const [mode, setMode] = useState<"single" | "merge">("single");

  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("image");

  const [images, setImages] = useState<MergeImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const [showCropper, setShowCropper] = useState(false);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [targetKB, setTargetKB] = useState(100);
  const [quality, setQuality] = useState(0.92);

  const [mergeDirection, setMergeDirection] = useState<"vertical" | "horizontal">(
    "vertical"
  );

  const [gap, setGap] = useState(0);

  const [result, setResult] = useState<JPGResult | null>(null);
  const [message, setMessage] = useState("");

  function loadImageDimensions(
    dataUrl: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = () => {
        reject(new Error("Unable to load image."));
      };

      img.src = dataUrl;
    });
  }

  async function handleSingleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const dataUrl = reader.result as string;

      try {
        const dimensions = await loadImageDimensions(dataUrl);

        setImage(dataUrl);
        setFileName(getFileNameWithoutExtension(file.name));
        setWidth(dimensions.width);
        setHeight(dimensions.height);

        setResult(null);
        setMessage("");
      } catch {
        setMessage("Could not load this image.");
      }
    };

    reader.readAsDataURL(file);
  }

  async function handleMultipleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const newImages: MergeImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith("image/")) {
        continue;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          resolve(reader.result as string);
        };

        reader.onerror = () => {
          reject(new Error("Could not read file."));
        };

        reader.readAsDataURL(file);
      });

      try {
        const dimensions = await loadImageDimensions(dataUrl);

        newImages.push({
          id: `${Date.now()}-${i}-${Math.random()}`,
          image: dataUrl,
          fileName: file.name,
          width: dimensions.width,
          height: dimensions.height,
          originalSize: file.size,
        });
      } catch {
        // Ignore images that cannot be loaded.
      }
    }

    if (newImages.length === 0) {
      setMessage("No valid image files were selected.");
      return;
    }

    setImages((previous) => [...previous, ...newImages]);
    setResult(null);
    setMessage("");

    setTimeout(() => {
      updateMergeDimensions([...images, ...newImages]);
    }, 0);
  }

  function calculateMergeDimensions(
    imageList: MergeImage[],
    direction: "vertical" | "horizontal",
    gapSize: number
  ) {
    if (imageList.length === 0) {
      return {
        width: 0,
        height: 0,
      };
    }

    if (direction === "vertical") {
      const mergedWidth = Math.max(
        ...imageList.map((item) => item.width)
      );

      const mergedHeight =
        imageList.reduce((total, item) => total + item.height, 0) +
        gapSize * Math.max(0, imageList.length - 1);

      return {
        width: mergedWidth,
        height: mergedHeight,
      };
    }

    const mergedWidth =
      imageList.reduce((total, item) => total + item.width, 0) +
      gapSize * Math.max(0, imageList.length - 1);

    const mergedHeight = Math.max(
      ...imageList.map((item) => item.height)
    );

    return {
      width: mergedWidth,
      height: mergedHeight,
    };
  }

  function updateMergeDimensions(
    imageList: MergeImage[] = images,
    direction: "vertical" | "horizontal" = mergeDirection,
    gapSize: number = gap
  ) {
    if (imageList.length === 0) {
      setWidth(0);
      setHeight(0);
      return;
    }

    const dimensions = calculateMergeDimensions(
      imageList,
      direction,
      gapSize
    );

    setWidth(dimensions.width);
    setHeight(dimensions.height);
  }

  function handleModeChange(newMode: "single" | "merge") {
    setMode(newMode);
    setResult(null);
    setMessage("");

    if (newMode === "single") {
      if (image) {
        loadImageDimensions(image).then((dimensions) => {
          setWidth(dimensions.width);
          setHeight(dimensions.height);
        });
      }
    } else {
      updateMergeDimensions();
    }
  }

  function moveImage(index: number, direction: "up" | "down") {
    const newImages = [...images];

    if (direction === "up" && index > 0) {
      [newImages[index - 1], newImages[index]] = [
        newImages[index],
        newImages[index - 1],
      ];
    }

    if (direction === "down" && index < newImages.length - 1) {
      [newImages[index + 1], newImages[index]] = [
        newImages[index],
        newImages[index + 1],
      ];
    }

    setImages(newImages);
    setResult(null);
    updateMergeDimensions(newImages);
  }

  function removeImage(id: string) {
    const newImages = images.filter((item) => item.id !== id);

    setImages(newImages);

    if (selectedImageId === id) {
      setSelectedImageId(null);
      setShowCropper(false);
    }

    setResult(null);
    updateMergeDimensions(newImages);
  }

  function openCropper(id: string) {
    setSelectedImageId(id);
    setShowCropper(true);
  }

  async function handleCrop(croppedImage: string) {
    if (!selectedImageId) {
      return;
    }

    try {
      const dimensions = await loadImageDimensions(croppedImage);

      const newImages = images.map((item) =>
        item.id === selectedImageId
          ? {
              ...item,
              image: croppedImage,
              width: dimensions.width,
              height: dimensions.height,
            }
          : item
      );

      setImages(newImages);
      setShowCropper(false);
      setSelectedImageId(null);
      setResult(null);

      updateMergeDimensions(newImages);
    } catch {
      setMessage("Could not process the cropped image.");
    }
  }

  function createSingleJPG(
    imageData: string,
    outputWidth: number,
    outputHeight: number,
    jpgQuality: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");

        canvas.width = Math.max(1, Math.round(outputWidth));
        canvas.height = Math.max(1, Math.round(outputHeight));

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not create canvas."));
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve(
          canvas.toDataURL(
            "image/jpeg",
            Math.min(1, Math.max(0.01, jpgQuality))
          )
        );
      };

      img.onerror = () => {
        reject(new Error("Could not load image."));
      };

      img.src = imageData;
    });
  }

  async function createMergedJPG(
    imageList: MergeImage[],
    outputWidth: number,
    outputHeight: number,
    direction: "vertical" | "horizontal",
    gapSize: number,
    jpgQuality: number
  ): Promise<string> {
    if (imageList.length === 0) {
      throw new Error("No images selected.");
    }

    const loadedImages = await Promise.all(
      imageList.map(
        (item) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();

            img.onload = () => resolve(img);
            img.onerror = () =>
              reject(new Error(`Could not load ${item.fileName}`));

            img.src = item.image;
          })
      )
    );

    let naturalWidth = 0;
    let naturalHeight = 0;

    if (direction === "vertical") {
      naturalWidth = Math.max(
        ...loadedImages.map((img) => img.naturalWidth)
      );

      naturalHeight =
        loadedImages.reduce(
          (total, img) => total + img.naturalHeight,
          0
        ) +
        gapSize * Math.max(0, loadedImages.length - 1);
    } else {
      naturalWidth =
        loadedImages.reduce(
          (total, img) => total + img.naturalWidth,
          0
        ) +
        gapSize * Math.max(0, loadedImages.length - 1);

      naturalHeight = Math.max(
        ...loadedImages.map((img) => img.naturalHeight)
      );
    }

    const finalWidth =
      outputWidth > 0 ? Math.round(outputWidth) : naturalWidth;

    const finalHeight =
      outputHeight > 0 ? Math.round(outputHeight) : naturalHeight;

    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, finalWidth);
    canvas.height = Math.max(1, finalHeight);

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not create canvas.");
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / naturalWidth;
    const scaleY = canvas.height / naturalHeight;

    if (direction === "vertical") {
      let currentY = 0;

      for (const img of loadedImages) {
        const drawWidth = img.naturalWidth * scaleX;
        const drawHeight = img.naturalHeight * scaleY;

        const x = (canvas.width - drawWidth) / 2;

        ctx.drawImage(
          img,
          x,
          currentY,
          drawWidth,
          drawHeight
        );

        currentY += drawHeight + gapSize * scaleY;
      }
    } else {
      let currentX = 0;

      for (const img of loadedImages) {
        const drawWidth = img.naturalWidth * scaleX;
        const drawHeight = img.naturalHeight * scaleY;

        const y = (canvas.height - drawHeight) / 2;

        ctx.drawImage(
          img,
          currentX,
          y,
          drawWidth,
          drawHeight
        );

        currentX += drawWidth + gapSize * scaleX;
      }
    }

    return canvas.toDataURL(
      "image/jpeg",
      Math.min(1, Math.max(0.01, jpgQuality))
    );
  }

  async function createJPG(
    jpgQuality: number
  ): Promise<string> {
    if (mode === "single") {
      if (!image) {
        throw new Error("Please select an image first.");
      }

      return createSingleJPG(
        image,
        width,
        height,
        jpgQuality
      );
    }

    return createMergedJPG(
      images,
      width,
      height,
      mergeDirection,
      gap,
      jpgQuality
    );
  }

  async function convertNormal() {
    try {
      setMessage("Converting...");

      const dataUrl = await createJPG(quality);
      const size = getDataUrlSize(dataUrl);

      setResult({
        dataUrl,
        size,
        quality,
      });

      setMessage(
        `JPG created successfully. Size: ${(size / 1024).toFixed(1)} KB`
      );
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create JPG."
      );
    }
  }

  async function createJpgForTargetKB(
    requestedTargetKB: number
  ): Promise<JPGResult> {
    const targetBytes = Math.max(
      1,
      Math.round(requestedTargetKB * 1024)
    );

    let low = 0.01;
    let high = 1;
    let bestDataUrl = "";
    let bestSize = Infinity;
    let bestQuality = 0.01;

    for (let i = 0; i < 9; i++) {
      const middle = (low + high) / 2;

      const dataUrl = await createJPG(middle);
      const size = getDataUrlSize(dataUrl);

      if (size <= targetBytes) {
        if (size > bestSize) {
          // Keep searching for a result closer to the target.
        }

        bestDataUrl = dataUrl;
        bestSize = size;
        bestQuality = middle;

        low = middle;
      } else {
        high = middle;
      }
    }

    if (!bestDataUrl) {
      const smallestDataUrl = await createJPG(0.01);
      const smallestSize = getDataUrlSize(smallestDataUrl);

      return {
        dataUrl: smallestDataUrl,
        size: smallestSize,
        quality: 0.01,
      };
    }

    return {
      dataUrl: bestDataUrl,
      size: bestSize,
      quality: bestQuality,
    };
  }

  async function applyTargetKB(customTarget?: number) {
    const value =
      customTarget !== undefined
        ? customTarget
        : Number(targetKB);

    if (!Number.isFinite(value) || value <= 0) {
      setMessage("Please enter a valid KB size.");
      return;
    }

    setTargetKB(Math.round(value));
    setMessage("Creating JPG for target KB...");

    try {
      const jpg = await createJpgForTargetKB(value);

      setResult(jpg);

      if (jpg.size > value * 1024) {
        setMessage(
          `The smallest possible JPG is about ${(jpg.size / 1024).toFixed(
            1
          )} KB. The image cannot be reduced to ${value} KB with JPEG quality alone.`
        );
      } else {
        setMessage(
          `JPG created: ${(jpg.size / 1024).toFixed(
            1
          )} KB for target ${Math.round(value)} KB.`
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create JPG."
      );
    }
  }

  async function decreaseKB() {
    const newTarget = Math.max(
      1,
      Math.round(targetKB) - 1
    );

    setTargetKB(newTarget);
    await applyTargetKB(newTarget);
  }

  async function increaseKB() {
    const newTarget = Math.round(targetKB) + 1;

    setTargetKB(newTarget);
    await applyTargetKB(newTarget);
  }

  function downloadResult() {
    if (!result) {
      return;
    }

    const link = document.createElement("a");

    link.href = result.dataUrl;

    if (mode === "merge") {
      link.download = "merged-image.jpg";
    } else {
      link.download = `${fileName || "image"}.jpg`;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function resetImage() {
    setImage(null);
    setImages([]);
    setSelectedImageId(null);
    setShowCropper(false);
    setResult(null);
    setMessage("");
    setFileName("image");
    setWidth(0);
    setHeight(0);
    setTargetKB(100);
    setQuality(0.92);
    setGap(0);
    setMergeDirection("vertical");
  }

  function handleWidthChange(value: string) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      setWidth(0);
      return;
    }

    setWidth(Math.max(0, Math.round(number)));
    setResult(null);
  }

  function handleHeightChange(value: string) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      setHeight(0);
      return;
    }

    setHeight(Math.max(0, Math.round(number)));
    setResult(null);
  }

  function handleGapChange(value: string) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      setGap(0);
      return;
    }

    const newGap = Math.max(0, Math.round(number));

    setGap(newGap);
    setResult(null);

    if (mode === "merge") {
      updateMergeDimensions(images, mergeDirection, newGap);
    }
  }

  function handleDirectionChange(
    direction: "vertical" | "horizontal"
  ) {
    setMergeDirection(direction);
    setResult(null);

    if (images.length > 0) {
      updateMergeDimensions(images, direction, gap);
    }
  }

  const selectedImage = images.find(
    (item) => item.id === selectedImageId
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "30px 16px",
        background: "#f5f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          Image to JPG
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "24px",
          }}
        >
          Convert images to JPG, resize, crop, compress, or merge multiple
          images into one JPG.
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginBottom: "25px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => handleModeChange("single")}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid #2563eb",
              background:
                mode === "single" ? "#2563eb" : "#ffffff",
              color: mode === "single" ? "#ffffff" : "#2563eb",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Single Image
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("merge")}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid #2563eb",
              background:
                mode === "merge" ? "#2563eb" : "#ffffff",
              color: mode === "merge" ? "#ffffff" : "#2563eb",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Merge Images
          </button>
        </div>

        {mode === "single" && (
          <>
            {!image && (
              <div
                style={{
                  border: "2px dashed #2563eb",
                  borderRadius: "12px",
                  padding: "30px",
                  textAlign: "center",
                  marginBottom: "20px",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      handleSingleFile(file);
                    }
                  }}
                />

                <p
                  style={{
                    marginTop: "12px",
                    color: "#666",
                  }}
                >
                  Select an image to convert to JPG.
                </p>
              </div>
            )}

            {image && !showCropper && (
              <div>
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
                      maxHeight: "400px",
                      borderRadius: "10px",
                      border: "1px solid #ddd",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginBottom: "20px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowCropper(true)}
                    style={{
                      padding: "10px 16px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#f59e0b",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    Crop Image
                  </button>

                  <label
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      background: "#e5e7eb",
                      cursor: "pointer",
                    }}
                  >
                    Add Different Image
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                          handleSingleFile(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </>
        )}

        {mode === "merge" && (
          <div>
            <div
              style={{
                border: "2px dashed #2563eb",
                borderRadius: "12px",
                padding: "25px",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  handleMultipleFiles(event.target.files);
                  event.target.value = "";
                }}
              />

              <p
                style={{
                  marginTop: "12px",
                  color: "#666",
                }}
              >
                Select multiple images to merge into one JPG.
              </p>
            </div>

            {images.length > 0 && (
              <div
                style={{
                  marginBottom: "25px",
                }}
              >
                <h3 style={{ marginBottom: "12px" }}>
                  Selected Images ({images.length})
                </h3>

                {images.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      marginBottom: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "10px",
                      background: "#fafafa",
                      flexWrap: "wrap",
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.fileName}
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                      }}
                    />

                    <div
                      style={{
                        flex: 1,
                        minWidth: "180px",
                      }}
                    >
                      <strong>{item.fileName}</strong>

                      <div
                        style={{
                          color: "#666",
                          fontSize: "13px",
                          marginTop: "4px",
                        }}
                      >
                        {item.width} × {item.height}px
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => moveImage(index, "up")}
                        disabled={index === 0}
                        style={{
                          padding: "7px 10px",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          background: "#ffffff",
                          cursor:
                            index === 0
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => moveImage(index, "down")}
                        disabled={index === images.length - 1}
                        style={{
                          padding: "7px 10px",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          background: "#ffffff",
                          cursor:
                            index === images.length - 1
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() => openCropper(item.id)}
                        style={{
                          padding: "7px 10px",
                          border: "none",
                          borderRadius: "6px",
                          background: "#f59e0b",
                          color: "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        Crop
                      </button>

                      <button
                        type="button"
                        onClick={() => removeImage(item.id)}
                        style={{
                          padding: "7px 10px",
                          border: "none",
                          borderRadius: "6px",
                          background: "#dc2626",
                          color: "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showCropper && selectedImage && (
          <div
            style={{
              marginBottom: "25px",
            }}
          >
            <ImageCropper
              image={selectedImage.image}
              onCrop={handleCrop}
              onCancel={() => {
                setShowCropper(false);
                setSelectedImageId(null);
              }}
            />
          </div>
        )}

        {!showCropper && (image || images.length > 0) && (
          <>
            {mode === "merge" && images.length > 0 && (
              <div
                style={{
                  padding: "18px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ marginBottom: "15px" }}>
                  Merge Settings
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "15px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: 600,
                      }}
                    >
                      Direction
                    </label>

                    <select
                      value={mergeDirection}
                      onChange={(event) =>
                        handleDirectionChange(
                          event.target.value as
                            | "vertical"
                            | "horizontal"
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "7px",
                        border: "1px solid #ccc",
                      }}
                    >
                      <option value="vertical">
                        Vertical
                      </option>
                      <option value="horizontal">
                        Horizontal
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: 600,
                      }}
                    >
                      Gap (px)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={gap}
                      onChange={(event) =>
                        handleGapChange(event.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "7px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                padding: "18px",
                background: "#f8fafc",
                borderRadius: "10px",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ marginBottom: "15px" }}>
                Output Size
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "15px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: 600,
                    }}
                  >
                    Width (px)
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={width || ""}
                    onChange={(event) =>
                      handleWidthChange(event.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "7px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: 600,
                    }}
                  >
                    Height (px)
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={height || ""}
                    onChange={(event) =>
                      handleHeightChange(event.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "7px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "18px",
                background: "#f8fafc",
                borderRadius: "10px",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ marginBottom: "15px" }}>
                JPG Size
              </h3>

              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}
              >
                Target Size (KB)
              </label>

              <input
                type="number"
                min="1"
                value={targetKB}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  if (Number.isFinite(value) && value > 0) {
                    setTargetKB(Math.round(value));
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyTargetKB();
                  }
                }}
                style={{
                  width: "100%",
                  maxWidth: "250px",
                  padding: "10px",
                  borderRadius: "7px",
                  border: "1px solid #ccc",
                  marginBottom: "12px",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: "15px",
                }}
              >
                <button
                  type="button"
                  onClick={decreaseKB}
                  style={{
                    padding: "9px 14px",
                    border: "1px solid #ccc",
                    borderRadius: "7px",
                    background: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  -1 KB
                </button>

                <button
                  type="button"
                  onClick={increaseKB}
                  style={{
                    padding: "9px 14px",
                    border: "1px solid #ccc",
                    borderRadius: "7px",
                    background: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  +1 KB
                </button>

                <button
                  type="button"
                  onClick={() => applyTargetKB()}
                  style={{
                    padding: "9px 16px",
                    border: "none",
                    borderRadius: "7px",
                    background: "#7c3aed",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Apply KB Size
                </button>
              </div>

              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}
              >
                JPG Quality
              </label>

              <input
                type="range"
                min="0.1"
                max="1"
                step="0.01"
                value={quality}
                onChange={(event) => {
                  setQuality(Number(event.target.value));
                  setResult(null);
                }}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                }}
              />

              <div
                style={{
                  marginTop: "5px",
                  color: "#666",
                }}
              >
                Quality: {Math.round(quality * 100)}%
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              <button
                type="button"
                onClick={convertNormal}
                style={{
                  padding: "12px 20px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#2563eb",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Convert to JPG
              </button>

              <button
                type="button"
                onClick={() => applyTargetKB()}
                style={{
                  padding: "12px 20px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#16a34a",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Create Target KB JPG
              </button>

              <button
                type="button"
                onClick={resetImage}
                style={{
                  padding: "12px 20px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#6b7280",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Start Again
              </button>
            </div>
          </>
        )}

        {message && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "#eff6ff",
              color: "#1e40af",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            {message}
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              background: "#ffffff",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                marginBottom: "15px",
              }}
            >
              JPG Result
            </h2>

            <div
              style={{
                textAlign: "center",
                marginBottom: "15px",
              }}
            >
              <img
                src={result.dataUrl}
                alt="JPG result"
                style={{
                  maxWidth: "100%",
                  maxHeight: "450px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                }}
              />
            </div>

            <div
              style={{
                textAlign: "center",
                color: "#555",
                marginBottom: "15px",
              }}
            >
              <div>
                Size: {(result.size / 1024).toFixed(1)} KB
              </div>

              <div>
                Quality: {Math.round(result.quality * 100)}%
              </div>

              <div>
                Dimensions: {width} × {height}px
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={downloadResult}
                style={{
                  padding: "12px 22px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#16a34a",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Download JPG
              </button>

              <button
                type="button"
                onClick={() => applyTargetKB()}
                style={{
                  padding: "12px 22px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#7c3aed",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Apply Different KB
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}