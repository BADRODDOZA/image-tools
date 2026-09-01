import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JPG to PDF Converter Online Free",
  description:
    "Convert JPG images to PDF online for free. Upload your JPG image, create a PDF instantly, and download it easily.",
};

export default function JpgToPdfLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}