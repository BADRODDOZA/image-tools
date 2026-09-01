import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Online Image Tools – Resize, Compress & Convert",
  description:
    "Explore free online image tools to resize, compress, crop and convert JPG, PNG and WebP images, plus PDF tools and more.",
};

export default function ToolsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}