import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WebP to PNG Converter Online Free",
  description:
    "Convert WebP images to PNG online for free. Upload your WebP image, convert it instantly, and download the PNG file.",
};

export default function WebpToPngLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}