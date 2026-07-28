import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Home of Suya — BBQ Booking",
  description:
    "Order authentic Home of Suya meals — select your favourite BBQ dishes, choose a date, and get them delivered or pick up.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "Home of Suya",
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
