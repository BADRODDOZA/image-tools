import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PNG to JPG Converter Online Free",
  description:
    "Convert PNG images to JPG online for free. Upload your PNG image, convert it instantly, and download the JPG file.",
};

export default function PngToJpgLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}