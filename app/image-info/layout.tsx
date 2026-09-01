import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Information Tool Online Free",
  description:
    "View image information online for free. Check image dimensions, file size, format and other useful image details.",
};

export default function ImageInfoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}