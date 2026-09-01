import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to JPG Converter Online Free",
  description:
    "Convert PDF pages to JPG images online for free. Upload a PDF, convert its pages to JPG, and download your images easily.",
};

export default function PdfToJpgLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}