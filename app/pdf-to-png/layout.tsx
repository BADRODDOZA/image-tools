import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to PNG Converter Online Free",
  description:
    "Convert PDF pages to PNG images online for free. Upload a PDF, convert its pages to PNG, and download your images easily.",
};

export default function PdfToPngLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}