import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JPG to WebP Converter Online Free",
  description:
    "Convert JPG images to WebP online for free. Upload a JPG image, convert it instantly, and download the WebP file.",
};

export default function JpgToWebpLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}