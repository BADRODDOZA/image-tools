import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compress Image Online Free – Reduce Image Size",
  description:
    "Compress JPG, PNG and WebP images online for free. Reduce image file size while maintaining good quality and download your compressed image instantly.",
};

export default function CompressLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}