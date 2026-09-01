import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PNG to PDF Converter Online Free",
  description:
    "Convert PNG images to PDF online for free. Upload your PNG image, create a PDF instantly, and download it easily.",
};

export default function PngToPdfLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}