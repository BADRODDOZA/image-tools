import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Free Image Tools – Resize, Compress & Convert Images",
  description:
    "Free online image tools to resize, compress and convert JPG, PNG, WebP and PDF files. Convert images, create PDFs and remove backgrounds easily.",
  keywords: [
    "image tools",
    "resize image",
    "compress image",
    "JPG to PNG",
    "PNG to JPG",
    "JPG to PDF",
    "PDF to JPG",
    "PDF to PNG",
    "JPG to WebP",
    "WebP to JPG",
    "remove background",
    "image converter",
    "free image tools",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, sans-serif",
          background: "#f4f6f9",
        }}
      >
        <Header />

        <main
          style={{
            padding: "30px",
            minHeight: "80vh",
          }}
        >
          {children}
        </main>

       <Footer />
       
      </body>
    </html>
  );
}