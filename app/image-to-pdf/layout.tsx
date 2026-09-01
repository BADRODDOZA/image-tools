import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image to PDF Converter Online Free",
  description:
    "Convert JPG, PNG and other images to PDF online for free. Create PDF files from your images quickly and easily.",
};

export default function ImageToPdfLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}