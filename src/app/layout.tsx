import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import FooterWrapper from "@/components/ui/FooterWrapper";
import GlobalHeader from "@/components/ui/GlobalHeader";
import CookieConsent from "@/components/ui/CookieConsent";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Home of Suya — BBQ Booking",
  description:
    "Order authentic Home of Suya meals — select your favourite BBQ dishes, choose a date, and get them delivered or pick up.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  icons: {
    icon: [
      {
        url: "/api/meal-photos?name=Logo.jpeg",
        type: "image/jpeg",
        sizes: "any",
      },
    ],
    apple: "/api/meal-photos?name=Logo.jpeg",
  },
  openGraph: {
    title: "Home of Suya",
    description: "Authentic BBQ booking — Cardiff & UK Postage",
    type: "website",
    url: "https://www.homeofsuya.com",
    images: [
      {
        url: "/api/meal-photos?name=Logo.jpeg",
        width: 1200,
        height: 630,
        alt: "Home of Suya Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Home of Suya",
    description: "Authentic BBQ booking — Cardiff & UK Postage",
    images: ["/api/meal-photos?name=Logo.jpeg"],
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
        <CartProvider>
          <GlobalHeader />
          {children}
          <FooterWrapper />
          <CookieConsent />
        </CartProvider>
      </body>
    </html>
  );
}
