import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flip Image Online Free – Horizontal & Vertical",
  description:
    "Flip JPG, PNG and WebP images online for free. Flip images horizontally or vertically and download the result instantly.",
};

export default function FlipLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}