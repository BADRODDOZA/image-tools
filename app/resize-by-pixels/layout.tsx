import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resize Image by Pixels Online Free",
  description:
    "Resize JPG, PNG and WebP images to exact pixel dimensions online for free. Set your desired width and height and download your resized image.",
};

export default function ResizeByPixelsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}