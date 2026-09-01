import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resize Image Online Free – JPG, PNG & WebP",
  description:
    "Resize JPG, PNG and WebP images online for free. Set custom width and height and download your resized image instantly.",
};

export default function ResizeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}