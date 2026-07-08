import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Malam Special Suya — BBQ Booking",
  description:
    "Order authentic Malam Special Suya — select your favourite BBQ meals, choose a date, and get it delivered or pick up.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "Malam Special Suya",
    description: "Authentic BBQ booking — Cardiff & UK Postage",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-brand-black">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
