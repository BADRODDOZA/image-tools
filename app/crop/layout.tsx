import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crop Image Online Free – JPG, PNG & WebP",
  description:
    "Crop JPG, PNG and WebP images online for free. Easily crop your image and download the result instantly.",
};

export default function CropLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}