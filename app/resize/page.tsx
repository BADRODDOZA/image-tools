"use client";
import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

const FRAMES = [
  { name: "Free", ratio: 0, label: "🆓 Free" },
  { name: "Square", ratio: 1/1, label: "📸 1:1" },
  { name: "Portrait", ratio: 4/5, label: "📱 4:5" },
  { name: "Landscape", ratio: 16/9, label: "🖥️ 16:9" },
  { name: "A4", ratio: 210/297, label: "📄 A4" },
  { name: "Story", ratio: 9/16, label: "📲 9:16" },
];

export default function ResizePage() {
  const [image, setImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState(0);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [resizedImage, setResizedImage] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCrop = (croppedImage: string) => {
    setImage(croppedImage); // crop korar por image update
    setShowCropper(false);
  };

  const handleResize = () => {
    if (!image) return;
    const img = new Image();
    img.src = image;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      setResizedImage(canvas.toDataURL("image/jpeg", 0.9));
    };
  };

  const downloadImage = () => {
    if (!resizedImage) return;
    const a = document.createElement("a");
    a.href = resizedImage;
    a.download = "resized-image.jpg";
    a.click();
  };

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", padding: "20px", background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
      <h1 style={{ color: "#1e3a8a" }}>🖼️ Resize Image</h1>

      <input type="file" accept="image/*" onChange={handleFile} style={{ marginBottom: "15px" }} />

      {image &&!showCropper && (
        <>
          {/* 1. Frame Selector */}
          <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "12px", marginBottom: "15px" }}>
            <h3 style={{ marginTop: 0, color: "#1e3a8a" }}>🖼️ Step 1: Choose Frame</h3>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {FRAMES.map(frame => (
                <button
                  key={frame.name}
                  onClick={() => setSelectedRatio(frame.ratio)}
                  style={{
                    padding: "8px 12px",
                    background: selectedRatio === frame.ratio? "#2563eb" : "#e2e8f0",
                    color: selectedRatio === frame.ratio? "white" : "#333",
                    border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px"
                  }}
                >
                  {frame.label}
                </button>
              ))}
            </div>
          </div>

          <img src={image} alt="preview" style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: "10px" }} />
          <button onClick={() => setShowCropper(true)} style={{ padding: "10px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", marginRight: "10px" }}>
            ✂️ Crop First
          </button>

          {/* 2. Resize Inputs */}
          <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "12px", marginTop: "15px" }}>
            <h3 style={{ marginTop: 0, color: "#1e3a8a" }}>📏 Step 2: Set Size</h3>
            <input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} placeholder="Width" style={{ padding: "8px", marginRight: "10px", width: "100px" }} />
            <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} placeholder="Height" style={{ padding: "8px", width: "100px" }} />
            <br />
            <button onClick={handleResize} style={{ marginTop: "10px", padding: "10px 20px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px" }}>
              Resize Image
            </button>
          </div>
        </>
      )}

      {showCropper && image && (
        <ImageCropper
          image={image}
          aspectRatio={selectedRatio}
          onCrop={handleCrop}
          onCancel={() => setShowCropper(false)}
        />
      )}

      {resizedImage && (
        <div style={{ marginTop: "20px" }}>
          <h3>✅ Result:</h3>
          <img src={resizedImage} alt="resized" style={{ maxWidth: "100%", borderRadius: "8px" }} />
          <br />
          <button onClick={downloadImage} style={{ marginTop: "10px", padding: "10px 20px", background: "#f59e0b", color: "white", border: "none", borderRadius: "8px" }}>
            ⬇️ Download
          </button>
        </div>
      )}
    </div>
  );
}