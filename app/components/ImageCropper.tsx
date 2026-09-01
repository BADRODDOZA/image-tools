"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  image: string;
  aspectRatio?: number;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
}

type Point = {
  x: number;
  y: number;
};

type Handle =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

type Crop = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export default function ImageCropper({
  image,
  aspectRatio,
  onCrop,
  onCancel,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
  });

  const [displayImage, setDisplayImage] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const [crop, setCrop] = useState<Crop>({
    left: 10,
    top: 10,
    right: 90,
    bottom: 90,
  });

  const [dragging, setDragging] = useState<
    Handle | "move" | null
  >(null);

  const [startMouse, setStartMouse] =
    useState<Point | null>(null);

  const [startCrop, setStartCrop] = useState<Crop>({
    left: 10,
    top: 10,
    right: 90,
    bottom: 90,
  });

  /*
   * Load image
   */
  useEffect(() => {
    const img = new Image();

    img.onload = () => {
      setImageSize({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.src = image;
  }, [image]);

  /*
   * Calculate the real displayed image area.
   *
   * This is important because the image uses
   * object-fit: contain.
   */
  useEffect(() => {
    const updateDisplayImage = () => {
      const container = containerRef.current;

      if (
        !container ||
        !imageSize.width ||
        !imageSize.height
      ) {
        return;
      }

      const rect =
        container.getBoundingClientRect();

      const containerWidth = rect.width;
      const containerHeight = rect.height;

      const imageRatio =
        imageSize.width / imageSize.height;

      const containerRatio =
        containerWidth / containerHeight;

      let width;
      let height;
      let left;
      let top;

      if (imageRatio > containerRatio) {
        width = containerWidth;
        height = width / imageRatio;

        left = 0;
        top =
          (containerHeight - height) / 2;
      } else {
        height = containerHeight;
        width = height * imageRatio;

        top = 0;
        left =
          (containerWidth - width) / 2;
      }

      setDisplayImage({
        left,
        top,
        width,
        height,
      });
    };

    updateDisplayImage();

    window.addEventListener(
      "resize",
      updateDisplayImage
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateDisplayImage
      );
    };
  }, [imageSize]);

  /*
   * Clamp helper
   */
  const clamp = (
    value: number,
    min: number,
    max: number
  ) => {
    return Math.max(
      min,
      Math.min(max, value)
    );
  };

  /*
   * Convert mouse position into percentage
   * of the ACTUAL displayed image.
   */
  const getMousePosition = (
    e: MouseEvent | React.MouseEvent
  ): Point => {
    const container =
      containerRef.current;

    if (
      !container ||
      !displayImage.width ||
      !displayImage.height
    ) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect =
      container.getBoundingClientRect();

    const mouseX =
      e.clientX - rect.left;

    const mouseY =
      e.clientY - rect.top;

    const imageX =
      ((mouseX - displayImage.left) /
        displayImage.width) *
      100;

    const imageY =
      ((mouseY - displayImage.top) /
        displayImage.height) *
      100;

    return {
      x: clamp(imageX, 0, 100),
      y: clamp(imageY, 0, 100),
    };
  };

  /*
   * Start dragging
   */
  const handleMouseDown = (
    e: React.MouseEvent,
    handle: Handle | "move"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setDragging(handle);

    setStartMouse(
      getMousePosition(e)
    );

    setStartCrop({
      ...crop,
    });
  };

  /*
   * Mouse movement
   */
  useEffect(() => {
    if (
      !dragging ||
      !startMouse
    ) {
      return;
    }

    const handleMouseMove = (
      e: MouseEvent
    ) => {
      const currentMouse =
        getMousePosition(e);

      const dx =
        currentMouse.x -
        startMouse.x;

      const dy =
        currentMouse.y -
        startMouse.y;

      let newCrop: Crop = {
        ...startCrop,
      };

      const minSize = 5;

      /*
       * LEFT
       */
      if (dragging === "left") {
        newCrop.left = clamp(
          startCrop.left + dx,
          0,
          startCrop.right - minSize
        );
      }

      /*
       * RIGHT
       */
      if (dragging === "right") {
        newCrop.right = clamp(
          startCrop.right + dx,
          startCrop.left + minSize,
          100
        );
      }

      /*
       * TOP
       */
      if (dragging === "top") {
        newCrop.top = clamp(
          startCrop.top + dy,
          0,
          startCrop.bottom - minSize
        );
      }

      /*
       * BOTTOM
       */
      if (dragging === "bottom") {
        newCrop.bottom = clamp(
          startCrop.bottom + dy,
          startCrop.top + minSize,
          100
        );
      }

      /*
       * TOP LEFT
       */
      if (
        dragging === "top-left"
      ) {
        newCrop.left = clamp(
          startCrop.left + dx,
          0,
          startCrop.right - minSize
        );

        newCrop.top = clamp(
          startCrop.top + dy,
          0,
          startCrop.bottom - minSize
        );
      }

      /*
       * TOP RIGHT
       */
      if (
        dragging === "top-right"
      ) {
        newCrop.right = clamp(
          startCrop.right + dx,
          startCrop.left + minSize,
          100
        );

        newCrop.top = clamp(
          startCrop.top + dy,
          0,
          startCrop.bottom - minSize
        );
      }

      /*
       * BOTTOM LEFT
       */
      if (
        dragging === "bottom-left"
      ) {
        newCrop.left = clamp(
          startCrop.left + dx,
          0,
          startCrop.right - minSize
        );

        newCrop.bottom = clamp(
          startCrop.bottom + dy,
          startCrop.top + minSize,
          100
        );
      }

      /*
       * BOTTOM RIGHT
       */
      if (
        dragging === "bottom-right"
      ) {
        newCrop.right = clamp(
          startCrop.right + dx,
          startCrop.left + minSize,
          100
        );

        newCrop.bottom = clamp(
          startCrop.bottom + dy,
          startCrop.top + minSize,
          100
        );
      }

      /*
       * MOVE ENTIRE FRAME
       */
      if (dragging === "move") {
        const cropWidth =
          startCrop.right -
          startCrop.left;

        const cropHeight =
          startCrop.bottom -
          startCrop.top;

        let newLeft =
          startCrop.left + dx;

        let newTop =
          startCrop.top + dy;

        newLeft = clamp(
          newLeft,
          0,
          100 - cropWidth
        );

        newTop = clamp(
          newTop,
          0,
          100 - cropHeight
        );

        newCrop.left =
          newLeft;

        newCrop.right =
          newLeft + cropWidth;

        newCrop.top =
          newTop;

        newCrop.bottom =
          newTop + cropHeight;
      }

      /*
       * Aspect ratio support
       *
       * If aspectRatio is provided,
       * resize using the active corner/side.
       */
      if (
        aspectRatio &&
        dragging !== "move"
      ) {
        const width =
          newCrop.right -
          newCrop.left;

        const height =
          newCrop.bottom -
          newCrop.top;

        const imageRatio =
          imageSize.width /
          imageSize.height;

        const currentPixelWidth =
          (width / 100) *
          imageSize.width;

        const desiredPixelHeight =
          currentPixelWidth /
          aspectRatio;

        const desiredPercentHeight =
          (desiredPixelHeight /
            imageSize.height) *
          100;

        if (
          dragging === "left" ||
          dragging === "right" ||
          dragging === "top-left" ||
          dragging === "top-right" ||
          dragging === "bottom-left" ||
          dragging === "bottom-right"
        ) {
          const centerY =
            (newCrop.top +
              newCrop.bottom) /
            2;

          let newTop =
            centerY -
            desiredPercentHeight / 2;

          let newBottom =
            centerY +
            desiredPercentHeight / 2;

          if (newTop < 0) {
            newTop = 0;
            newBottom =
              desiredPercentHeight;
          }

          if (newBottom > 100) {
            newBottom = 100;
            newTop =
              100 -
              desiredPercentHeight;
          }

          newCrop.top =
            clamp(newTop, 0, 100);

          newCrop.bottom =
            clamp(newBottom, 0, 100);
        }

        /*
         * Avoid unused calculation warning
         */
        void imageRatio;
      }

      setCrop(newCrop);
    };

    const handleMouseUp = () => {
      setDragging(null);
      setStartMouse(null);
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "mouseup",
      handleMouseUp
    );

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "mouseup",
        handleMouseUp
      );
    };
  }, [
    dragging,
    startMouse,
    startCrop,
    displayImage,
    imageSize,
  ]);

  /*
   * Crop image
   */
  const handleCrop = () => {
    if (
      !imageSize.width ||
      !imageSize.height
    ) {
      return;
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    /*
     * Convert crop percentages
     * into original image pixels.
     */
    const sourceX =
      (crop.left / 100) *
      imageSize.width;

    const sourceY =
      (crop.top / 100) *
      imageSize.height;

    const sourceWidth =
      ((crop.right -
        crop.left) /
        100) *
      imageSize.width;

    const sourceHeight =
      ((crop.bottom -
        crop.top) /
        100) *
      imageSize.height;

    canvas.width =
      Math.max(
        1,
        Math.round(sourceWidth)
      );

    canvas.height =
      Math.max(
        1,
        Math.round(sourceHeight)
      );

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const img = new Image();

    img.onload = () => {
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const croppedImage =
        canvas.toDataURL(
          "image/jpeg",
          0.95
        );

      onCrop(croppedImage);
    };

    img.src = image;
  };

  const cropWidth =
    crop.right -
    crop.left;

  const cropHeight =
    crop.bottom -
    crop.top;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        background: "#111827",
        borderRadius: "16px",
        padding: "15px",
        boxSizing: "border-box",
      }}
    >
      {/* TITLE */}

      <div
        style={{
          color: "white",
          textAlign: "center",
          marginBottom: "12px",
          fontWeight: "bold",
          fontSize: "18px",
        }}
      >
        ✂️ Frame Your Image
      </div>

      {/* IMAGE CONTAINER */}

      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "450px",
          background: "#000",
          overflow: "hidden",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        {/* IMAGE */}

        <img
          src={image}
          alt="Crop"
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />

        {/* DARK OVERLAY */}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "rgba(0,0,0,0.55)",
            pointerEvents: "none",
          }}
        />

        {/* CROP FRAME */}

        <div
          onMouseDown={(e) =>
            handleMouseDown(
              e,
              "move"
            )
          }
          style={{
            position: "absolute",

            left: `calc(${displayImage.left}px + ${(
              (crop.left / 100) *
              displayImage.width
            ).toFixed(2)}px)`,

            top: `calc(${displayImage.top}px + ${(
              (crop.top / 100) *
              displayImage.height
            ).toFixed(2)}px)`,

            width: `${
              (cropWidth / 100) *
              displayImage.width
            }px`,

            height: `${
              (cropHeight / 100) *
              displayImage.height
            }px`,

            border:
              "2px solid white",

            boxSizing:
              "border-box",

            cursor: "move",

            background:
              "rgba(255,255,255,0.05)",

            zIndex: 5,
          }}
        >
          {/* GRID VERTICAL */}

          <div
            style={{
              position:
                "absolute",
              left: "33.33%",
              top: 0,
              bottom: 0,
              width: "1px",
              background:
                "rgba(255,255,255,0.45)",
              pointerEvents:
                "none",
            }}
          />

          <div
            style={{
              position:
                "absolute",
              left: "66.66%",
              top: 0,
              bottom: 0,
              width: "1px",
              background:
                "rgba(255,255,255,0.45)",
              pointerEvents:
                "none",
            }}
          />

          {/* GRID HORIZONTAL */}

          <div
            style={{
              position:
                "absolute",
              top: "33.33%",
              left: 0,
              right: 0,
              height: "1px",
              background:
                "rgba(255,255,255,0.45)",
              pointerEvents:
                "none",
            }}
          />

          <div
            style={{
              position:
                "absolute",
              top: "66.66%",
              left: 0,
              right: 0,
              height: "1px",
              background:
                "rgba(255,255,255,0.45)",
              pointerEvents:
                "none",
            }}
          />

          {/* TOP */}

          <Handle
            position="top"
            cursor="ns-resize"
            onMouseDown={
              handleMouseDown
            }
          />

          {/* BOTTOM */}

          <Handle
            position="bottom"
            cursor="ns-resize"
            onMouseDown={
              handleMouseDown
            }
          />

          {/* LEFT */}

          <Handle
            position="left"
            cursor="ew-resize"
            onMouseDown={
              handleMouseDown
            }
          />

          {/* RIGHT */}

          <Handle
            position="right"
            cursor="ew-resize"
            onMouseDown={
              handleMouseDown
            }
          />

          {/* TOP LEFT */}

          <Handle
            position="top-left"
            cursor="nwse-resize"
            onMouseDown={
              handleMouseDown
            }
          />

          {/* TOP RIGHT */}

          <Handle
            position="top-right"
            cursor="nesw-resize"
            onMouseDown={
              handleMouseDown
            }
          />

          {/* BOTTOM LEFT */}

          <Handle
            position="bottom-left"
            cursor="nesw-resize"
            onMouseDown={
              handleMouseDown
            }
          />

          {/* BOTTOM RIGHT */}

          <Handle
            position="bottom-right"
            cursor="nwse-resize"
            onMouseDown={
              handleMouseDown
            }
          />
        </div>
      </div>

      {/* BUTTONS */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "15px",
        }}
      >
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "13px",
            background: "#64748b",
            color: "white",
            border: "none",
            borderRadius: "9px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>

        <button
          onClick={handleCrop}
          style={{
            flex: 1,
            padding: "13px",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "9px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ✂️ Crop & Save
        </button>
      </div>
    </div>
  );
}

/*
 * HANDLE COMPONENT
 */

function Handle({
  position,
  cursor,
  onMouseDown,
}: {
  position: Handle;
  cursor: string;
  onMouseDown: (
    e: React.MouseEvent,
    handle: Handle
  ) => void;
}) {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    width: "16px",
    height: "16px",
    background: "white",
    border:
      "2px solid #2563eb",
    borderRadius: "50%",
    boxSizing: "border-box",
    cursor,
    zIndex: 10,
  };

  const styles: Record<
    Handle,
    React.CSSProperties
  > = {
    top: {
      left: "50%",
      top: "-8px",
      transform:
        "translateX(-50%)",
    },

    bottom: {
      left: "50%",
      bottom: "-8px",
      transform:
        "translateX(-50%)",
    },

    left: {
      left: "-8px",
      top: "50%",
      transform:
        "translateY(-50%)",
    },

    right: {
      right: "-8px",
      top: "50%",
      transform:
        "translateY(-50%)",
    },

    "top-left": {
      left: "-8px",
      top: "-8px",
    },

    "top-right": {
      right: "-8px",
      top: "-8px",
    },

    "bottom-left": {
      left: "-8px",
      bottom: "-8px",
    },

    "bottom-right": {
      right: "-8px",
      bottom: "-8px",
    },
  };

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();

        onMouseDown(
          e,
          position
        );
      }}
      style={{
        ...baseStyle,
        ...styles[position],
      }}
    />
  );
}