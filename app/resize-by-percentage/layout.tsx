import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resize Image by Percentage Online Free",
  description:
    "Resize JPG, PNG and WebP images by percentage online for free. Choose the resize percentage and download your resized image easily.",
};

export default function ResizeByPercentageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}