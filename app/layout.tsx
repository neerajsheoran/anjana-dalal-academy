import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Anjana Dalal Academy",
    template: "%s | Anjana Dalal Academy",
  },
  description:
    "CBSE learning made simple. Easy explanations, real-life examples, and structured content for Class 3 to 7.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
          <Header />
          {children}
          <Footer />
        </body>
    </html>
  );
}
