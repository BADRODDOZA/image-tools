"use client";

import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

type PDFImage = {
  id: string;
  name: string;
  data: string;
  width: number;
  height: number;
  originalSize: number;
};

export default function ImageToPDFPage() {
  const [images, setImages] = useState<PDFImage[]>([]);
  const [showCropper, setShowCropper] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);

  const [targetKB, setTargetKB] = useState(100);
  const [quality, setQuality] = useState(0.95);
  const [pdfSize, setPdfSize] = useState(0);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const fileArray = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (fileArray.length === 0) {
      alert("Please select image files.");
      return;
    }

    fileArray.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;

        if (typeof result !== "string") {
          return;
        }

        const img = new Image();

        img.onload = () => {
          const newImage: PDFImage = {
            id:
              Date.now().toString() +
              Math.random().toString(36).substring(2),
            name: file.name,
            data: result,
            width: img.width,
            height: img.height,
            originalSize: file.size,
          };

          setImages((previous) => [
            ...previous,
            newImage,
          ]);

          setPdfSize(0);
        };

        img.src = result;
      };

      reader.readAsDataURL(file);
    });
  };

  const createPdf = (
    pages: Uint8Array[]
  ): Uint8Array => {
    const encoder = new TextEncoder();

    const header = encoder.encode("%PDF-1.3\n");

    const objects: Uint8Array[] = [];

    const pageCount = pages.length;

    /*
      Object 1 = Catalog
      Object 2 = Pages
    */

    const obj1 = encoder.encode(
      `1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
`
    );

    objects.push(obj1);

    const pageObjectNumbers: number[] = [];

    let nextObjectNumber = 3;

    for (let i = 0; i < pageCount; i++) {
      pageObjectNumbers.push(nextObjectNumber);
      nextObjectNumber += 3;
    }

    const kids = pageObjectNumbers
      .map((number) => `${number} 0 R`)
      .join(" ");

    const obj2 = encoder.encode(
      `2 0 obj
<<
/Type /Pages
/Kids [${kids}]
/Count ${pageCount}
>>
endobj
`
    );

    objects.push(obj2);

    /*
      Each page uses 3 objects:

      Page
      Image
      Content
    */

    for (let i = 0; i < pageCount; i++) {
      const jpegData = pages[i];

      const img = new Image();

      /*
        The image dimensions are stored temporarily
        in the JPEG page object below.
      */

      void img;

      const pageNumber = pageObjectNumbers[i];

      const imageObjectNumber = pageNumber + 1;

      const contentObjectNumber = pageNumber + 2;

      const pageWidth = 595;

      /*
        Height is encoded separately by the caller
        into the first bytes of the page structure.
      */

      const heightBytes = jpegData.slice(0, 4);

      const view = new DataView(
        heightBytes.buffer,
        heightBytes.byteOffset,
        heightBytes.byteLength
      );

      const pageHeight = view.getUint32(0);

      const actualJpeg = jpegData.slice(4);

      const pageObject = encoder.encode(
        `${pageNumber} 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${pageWidth} ${pageHeight}]
/Resources <<
  /XObject <<
    /Im0 ${imageObjectNumber} 0 R
  >>
>>
/Contents ${contentObjectNumber} 0 R
>>
endobj
`
      );

      objects.push(pageObject);

      const imageHeader = encoder.encode(
        `${imageObjectNumber} 0 obj
<<
/Type /XObject
/Subtype /Image
/Width ${pageWidth}
/Height ${pageHeight}
/ColorSpace /DeviceRGB
/BitsPerComponent 8
/Filter /DCTDecode
/Length ${actualJpeg.length}
>>
stream
`
      );

      const imageFooter = encoder.encode(
        `
endstream
endobj
`
      );

      const imageObject = new Uint8Array(
        imageHeader.length +
          actualJpeg.length +
          imageFooter.length
      );

      imageObject.set(imageHeader, 0);

      imageObject.set(
        actualJpeg,
        imageHeader.length
      );

      imageObject.set(
        imageFooter,
        imageHeader.length +
          actualJpeg.length
      );

      objects.push(imageObject);

      const contentText = `q
${pageWidth} 0 0 ${pageHeight} 0 0 cm
/Im0 Do
Q
`;

      const contentBytes =
        encoder.encode(contentText);

      const contentHeader = encoder.encode(
        `${contentObjectNumber} 0 obj
<< /Length ${contentBytes.length} >>
stream
`
      );

      const contentFooter = encoder.encode(
        `
endstream
endobj
`
      );

      const contentObject = new Uint8Array(
        contentHeader.length +
          contentBytes.length +
          contentFooter.length
      );

      contentObject.set(contentHeader, 0);

      contentObject.set(
        contentBytes,
        contentHeader.length
      );

      contentObject.set(
        contentFooter,
        contentHeader.length +
          contentBytes.length
      );

      objects.push(contentObject);
    }

    const parts: Uint8Array[] = [];

    const offsets: number[] = [];

    let currentOffset = header.length;

    parts.push(header);

    for (const object of objects) {
      offsets.push(currentOffset);

      parts.push(object);

      currentOffset += object.length;
    }

    const xrefOffset = currentOffset;

    let xref =
      `xref
0 ${objects.length + 1}
0000000000 65535 f 
`;

    for (const offset of offsets) {
      xref +=
        `${offset
          .toString()
          .padStart(10, "0")} 00000 n 
`;
    }

    xref +=
      `trailer
<<
/Size ${objects.length + 1}
/Root 1 0 R
>>
startxref
${xrefOffset}
%%EOF
`;

    parts.push(
      encoder.encode(xref)
    );

    const totalLength = parts.reduce(
      (total, part) =>
        total + part.length,
      0
    );

    const pdf = new Uint8Array(
      totalLength
    );

    let position = 0;

    for (const part of parts) {
      pdf.set(part, position);

      position += part.length;
    }

    return pdf;
  };

  const makeSingleJpeg = async (
    item: PDFImage,
    jpegQuality: number
  ): Promise<Uint8Array> => {
    return new Promise(
      (resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          const pdfWidth = 595;

          const pdfHeight = Math.round(
            (img.height / img.width) *
              pdfWidth
          );

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width = pdfWidth;
          canvas.height = pdfHeight;

          const ctx =
            canvas.getContext("2d");

          if (!ctx) {
            reject(
              new Error(
                "Could not create canvas."
              )
            );

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

          const jpegDataUrl =
            canvas.toDataURL(
              "image/jpeg",
              jpegQuality
            );

          const base64 =
            jpegDataUrl.split(",")[1];

          const binary =
            atob(base64);

          const jpegBytes =
            new Uint8Array(
              binary.length
            );

          for (
            let i = 0;
            i < binary.length;
            i++
          ) {
            jpegBytes[i] =
              binary.charCodeAt(i);
          }

          /*
            Store PDF page height in the
            first 4 bytes.

            The remaining bytes are JPEG.
          */

          const result =
            new Uint8Array(
              4 + jpegBytes.length
            );

          const view =
            new DataView(
              result.buffer
            );

          view.setUint32(
            0,
            pdfHeight
          );

          result.set(
            jpegBytes,
            4
          );

          resolve(result);
        };

        img.onerror = () => {
          reject(
            new Error(
              "Could not load image."
            )
          );
        };

        img.src = item.data;
      }
    );
  };

  const makeMergedPdf = async (
    jpegQuality: number
  ): Promise<Uint8Array> => {
    const pages: Uint8Array[] = [];

    for (const item of images) {
      const page =
        await makeSingleJpeg(
          item,
          jpegQuality
        );

      pages.push(page);
    }

    return createPdf(pages);
  };

  const findBestPdfForTarget =
    async (
      target: number
    ): Promise<Uint8Array | null> => {
      if (images.length === 0) {
        return null;
      }

      const safeTarget =
        Math.max(
          1,
          Math.round(target)
        );

      const targetBytes =
        safeTarget * 1024;

      let low = 0.01;

      let high = 1;

      let bestPdf:
        | Uint8Array
        | null = null;

      let bestQuality = 0.01;

      for (
        let i = 0;
        i < 20;
        i++
      ) {
        const middle =
          (low + high) / 2;

        const pdf =
          await makeMergedPdf(
            middle
          );

        if (
          pdf.length <=
          targetBytes
        ) {
          bestPdf = pdf;

          bestQuality = middle;

          low = middle;
        } else {
          high = middle;
        }
      }

      if (!bestPdf) {
        bestPdf =
          await makeMergedPdf(
            0.01
          );

        bestQuality = 0.01;
      }

      setQuality(
        bestQuality
      );

      setPdfSize(
        bestPdf.length
      );

      return bestPdf;
    };

  const applyTargetKB =
    async () => {
      if (
        images.length === 0
      ) {
        alert(
          "Please select images first."
        );

        return;
      }

      const safeTarget =
        Math.max(
          1,
          Math.round(targetKB)
        );

      setTargetKB(
        safeTarget
      );

      await findBestPdfForTarget(
        safeTarget
      );
    };

  const decreaseKB =
    async () => {
      if (
        images.length === 0
      ) {
        alert(
          "Please select images first."
        );

        return;
      }

      const newTarget =
        Math.max(
          1,
          targetKB - 1
        );

      setTargetKB(
        newTarget
      );

      await findBestPdfForTarget(
        newTarget
      );
    };

  const increaseKB =
    async () => {
      if (
        images.length === 0
      ) {
        alert(
          "Please select images first."
        );

        return;
      }

      const newTarget =
        targetKB + 1;

      setTargetKB(
        newTarget
      );

      await findBestPdfForTarget(
        newTarget
      );
    };

  const convertToPdf =
    async () => {
      if (
        images.length === 0
      ) {
        alert(
          "Please select at least one image."
        );

        return;
      }

      const pdf =
        await findBestPdfForTarget(
          targetKB
        );

      if (!pdf) {
        alert(
          "Could not create PDF."
        );

        return;
      }

      /*
        Safe Blob construction for
        newer TypeScript versions.
      */

      const pdfArrayBuffer =
        new ArrayBuffer(
          pdf.byteLength
        );

      const pdfView =
        new Uint8Array(
          pdfArrayBuffer
        );

      pdfView.set(pdf);

      const blob =
        new Blob(
          [pdfArrayBuffer],
          {
            type: "application/pdf",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        "merged-images.pdf";

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      setTimeout(() => {
        URL.revokeObjectURL(
          url
        );
      }, 1000);
    };

  const removeImage = (
    index: number
  ) => {
    setImages((previous) =>
      previous.filter(
        (_, i) => i !== index
      )
    );

    setPdfSize(0);
  };

  const moveImageUp = (
    index: number
  ) => {
    if (index === 0) {
      return;
    }

    setImages((previous) => {
      const updated = [
        ...previous,
      ];

      const temp =
        updated[index - 1];

      updated[index - 1] =
        updated[index];

      updated[index] = temp;

      return updated;
    });

    setPdfSize(0);
  };

  const moveImageDown = (
    index: number
  ) => {
    if (
      index ===
      images.length - 1
    ) {
      return;
    }

    setImages((previous) => {
      const updated = [
        ...previous,
      ];

      const temp =
        updated[index + 1];

      updated[index + 1] =
        updated[index];

      updated[index] = temp;

      return updated;
    });

    setPdfSize(0);
  };

  const openCropper = (
    index: number
  ) => {
    setCropIndex(index);

    setShowCropper(true);
  };

  const handleCrop = (
    croppedImage: string
  ) => {
    if (
      cropIndex === null
    ) {
      return;
    }

    const img = new Image();

    img.onload = () => {
      setImages((previous) => {
        const updated = [
          ...previous,
        ];

        updated[cropIndex] = {
          ...updated[cropIndex],
          data: croppedImage,
          width: img.width,
          height: img.height,
        };

        return updated;
      });

      setPdfSize(0);
    };

    img.src = croppedImage;

    setShowCropper(false);

    setCropIndex(null);
  };

  const resetAll = () => {
    setImages([]);

    setShowCropper(false);

    setCropIndex(null);

    setTargetKB(100);

    setQuality(0.95);

    setPdfSize(0);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "30px 20px",
        background: "#f4f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#ffffff",
          padding: "30px",
          borderRadius: "16px",
          boxShadow:
            "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          Image to PDF
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "25px",
          }}
        >
          Merge multiple images into one PDF
          and control the PDF size in KB.
        </p>

        {!showCropper && (
          <>
            <div
              style={{
                textAlign: "center",
                padding: "35px",
                border:
                  "2px dashed #2563eb",
                borderRadius: "12px",
                background: "#f8fbff",
              }}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  handleFiles(
                    e.target.files
                  );

                  e.target.value = "";
                }}
              />

              <p
                style={{
                  marginTop: "12px",
                  color: "#666",
                  fontSize: "14px",
                }}
              >
                Select one or multiple images.
              </p>
            </div>

            {images.length > 0 && (
              <>
                <div
                  style={{
                    marginTop: "25px",
                    padding: "15px",
                    background: "#eff6ff",
                    borderRadius: "10px",
                    border:
                      "1px solid #bfdbfe",
                  }}
                >
                  <strong>
                    {images.length}{" "}
                    {images.length === 1
                      ? "image"
                      : "images"}{" "}
                    selected
                  </strong>

                  <p
                    style={{
                      marginTop: "5px",
                      color: "#555",
                      fontSize: "14px",
                    }}
                  >
                    Images will appear in the
                    PDF in the order shown below.
                  </p>
                </div>

                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {images.map(
                    (item, index) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          border:
                            "1px solid #ddd",
                          borderRadius: "10px",
                          background:
                            "#fafafa",
                        }}
                      >
                        <img
                          src={item.data}
                          alt={item.name}
                          style={{
                            width: "75px",
                            height: "75px",
                            objectFit:
                              "contain",
                            background:
                              "#ffffff",
                            border:
                              "1px solid #ddd",
                            borderRadius:
                              "8px",
                          }}
                        />

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <strong>
                            {index + 1}.{" "}
                            {item.name}
                          </strong>

                          <p
                            style={{
                              margin:
                                "5px 0 0",
                              color: "#666",
                              fontSize:
                                "13px",
                            }}
                          >
                            {item.width} ×{" "}
                            {item.height}
                          </p>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                            flexWrap:
                              "wrap",
                            justifyContent:
                              "flex-end",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              moveImageUp(
                                index
                              )
                            }
                            disabled={
                              index === 0
                            }
                            style={{
                              padding:
                                "7px 10px",
                              border: "none",
                              borderRadius:
                                "6px",
                              background:
                                index === 0
                                  ? "#ddd"
                                  : "#e5e7eb",
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
                            onClick={() =>
                              moveImageDown(
                                index
                              )
                            }
                            disabled={
                              index ===
                              images.length -
                                1
                            }
                            style={{
                              padding:
                                "7px 10px",
                              border: "none",
                              borderRadius:
                                "6px",
                              background:
                                index ===
                                images.length -
                                  1
                                  ? "#ddd"
                                  : "#e5e7eb",
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
                                index
                              )
                            }
                            style={{
                              padding:
                                "7px 10px",
                              border: "none",
                              borderRadius:
                                "6px",
                              background:
                                "#2563eb",
                              color:
                                "#ffffff",
                              cursor:
                                "pointer",
                            }}
                          >
                            Crop
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                index
                              )
                            }
                            style={{
                              padding:
                                "7px 10px",
                              border: "none",
                              borderRadius:
                                "6px",
                              background:
                                "#dc2626",
                              color:
                                "#ffffff",
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
                    marginTop: "25px",
                    padding: "20px",
                    borderRadius: "12px",
                    background:
                      "#f8fbff",
                    border:
                      "1px solid #dbeafe",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "20px",
                      marginBottom:
                        "15px",
                    }}
                  >
                    PDF Size Control
                  </h2>

                  <label
                    style={{
                      display:
                        "block",
                      fontWeight:
                        "bold",
                      marginBottom:
                        "8px",
                    }}
                  >
                    Target PDF Size (KB)
                  </label>

                  <div
                    style={{
                      display:
                        "flex",
                      gap: "8px",
                      flexWrap:
                        "wrap",
                      alignItems:
                        "center",
                    }}
                  >
                    <input
                      type="number"
                      min="1"
                      value={targetKB}
                      onChange={(e) => {
                        const value =
                          Number(
                            e.target
                              .value
                          );

                        if (
                          !Number.isNaN(
                            value
                          )
                        ) {
                          setTargetKB(
                            Math.max(
                              1,
                              Math.round(
                                value
                              )
                            )
                          );
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key ===
                          "Enter"
                        ) {
                          applyTargetKB();
                        }
                      }}
                      style={{
                        width:
                          "130px",
                        padding:
                          "10px",
                        border:
                          "1px solid #bbb",
                        borderRadius:
                          "8px",
                        fontSize:
                          "16px",
                      }}
                    />

                    <button
                      type="button"
                      onClick={
                        decreaseKB
                      }
                      style={{
                        padding:
                          "10px 15px",
                        border: "none",
                        borderRadius:
                          "8px",
                        background:
                          "#e5e7eb",
                        cursor:
                          "pointer",
                        fontSize:
                          "18px",
                      }}
                    >
                      −
                    </button>

                    <button
                      type="button"
                      onClick={
                        increaseKB
                      }
                      style={{
                        padding:
                          "10px 15px",
                        border: "none",
                        borderRadius:
                          "8px",
                        background:
                          "#e5e7eb",
                        cursor:
                          "pointer",
                        fontSize:
                          "18px",
                      }}
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={
                        applyTargetKB
                      }
                      style={{
                        padding:
                          "10px 18px",
                        border: "none",
                        borderRadius:
                          "8px",
                        background:
                          "#2563eb",
                        color:
                          "#ffffff",
                        cursor:
                          "pointer",
                        fontWeight:
                          "bold",
                      }}
                    >
                      Apply KB Size
                    </button>
                  </div>

                  <p
                    style={{
                      marginTop:
                        "12px",
                      color:
                        "#555",
                      fontSize:
                        "14px",
                    }}
                  >
                    Target:{" "}
                    <strong>
                      {targetKB} KB
                    </strong>
                  </p>

                  <p
                    style={{
                      color:
                        "#555",
                      fontSize:
                        "14px",
                    }}
                  >
                    JPEG Quality:{" "}
                    <strong>
                      {(
                        quality * 100
                      ).toFixed(
                        1
                      )}
                      %
                    </strong>
                  </p>

                  {pdfSize >
                    0 && (
                    <p
                      style={{
                        color:
                          "#15803d",
                        fontWeight:
                          "bold",
                        fontSize:
                          "15px",
                      }}
                    >
                      Current PDF
                      Size:{" "}
                      {(
                        pdfSize /
                        1024
                      ).toFixed(
                        2
                      )}{" "}
                      KB
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    gap: "10px",
                    justifyContent:
                      "center",
                    flexWrap:
                      "wrap",
                    marginTop:
                      "25px",
                  }}
                >
                  <button
                    type="button"
                    onClick={
                      convertToPdf
                    }
                    style={{
                      padding:
                        "13px 25px",
                      background:
                        "#16a34a",
                      color:
                        "#ffffff",
                      border:
                        "none",
                      borderRadius:
                        "8px",
                      cursor:
                        "pointer",
                      fontWeight:
                        "bold",
                      fontSize:
                        "16px",
                    }}
                  >
                    Merge & Download PDF
                  </button>

                  <button
                    type="button"
                    onClick={
                      resetAll
                    }
                    style={{
                      padding:
                        "13px 25px",
                      background:
                        "#dc2626",
                      color:
                        "#ffffff",
                      border:
                        "none",
                      borderRadius:
                        "8px",
                      cursor:
                        "pointer",
                      fontWeight:
                        "bold",
                        fontSize:
                        "16px",
                    }}
                  >
                    Remove All
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {showCropper &&
          cropIndex !== null &&
          images[cropIndex] && (
            <div
              style={{
                marginTop:
                  "25px",
              }}
            >
              <h2
                style={{
                  marginBottom:
                    "15px",
                  textAlign:
                    "center",
                }}
              >
                Crop Image{" "}
                {cropIndex + 1}
              </h2>

              <ImageCropper
                image={
                  images[
                    cropIndex
                  ].data
                }
                onCrop={
                  handleCrop
                }
                onCancel={() => {
                  setShowCropper(
                    false
                  );

                  setCropIndex(
                    null
                  );
                }}
              />
            </div>
          )}
      </div>
    </main>
  );
}