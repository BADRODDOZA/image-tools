import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Watermark to Image Online Free",
  description:
    "Add a text watermark to your images online for free. Upload an image, add your watermark, and download the watermarked image easily.",
};

export default function AddWatermarkLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}