import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WebP to JPG Converter Online Free",
  description:
    "Convert WebP images to JPG online for free. Upload your WebP image, convert it instantly, and download the JPG file.",
};

export default function WebpToJpgLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}