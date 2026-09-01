import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remove Background from Image Online Free",
  description:
    "Remove image backgrounds online for free. Upload your image and create a clean background-free image quickly and easily.",
};

export default function RemoveBackgroundLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}