import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JPG to PNG Converter Online Free",
  description:
    "Convert JPG images to PNG online for free. Upload your JPG image, convert it instantly, and download the PNG file.",
};

export default function JpgToPngLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}