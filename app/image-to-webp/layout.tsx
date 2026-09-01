import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image to WebP Converter Online Free",
  description:
    "Convert images to WebP online for free. Upload your image, convert it instantly, and download the WebP file easily.",
};

export default function ImageToWebpLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}