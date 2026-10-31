import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import FooterWrapper from "@/components/ui/FooterWrapper";
import GlobalHeader from "@/components/ui/GlobalHeader";
import CookieConsent from "@/components/ui/CookieConsent";
import { MaintenanceModechecker } from "@/components/MaintenanceModeChecker";
import { ToastContainer } from "@/components/ToastContainer";
import ServiceWorkerRegister from "@/components/ui/ServiceWorkerRegister";
import InstallBanner from "@/components/ui/InstallBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#C41E3A",
};

export const metadata: Metadata = {
  title: "Home of Suya — BBQ Booking",
  description:
    "Order authentic Home of Suya meals — select your favourite BBQ dishes, choose a date, and get them delivered or pick up.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  applicationName: "Home of Suya",
  appleWebApp: {
    capable: true,
    title: "Home of Suya",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    apple: "/icons/apple-touch-icon.png",
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
      <body className="min-h-screen bg-white">
        <CartProvider>
          <MaintenanceModechecker>
            <InstallBanner />
            <GlobalHeader />
            {children}
            <FooterWrapper />
            <CookieConsent />
            <ToastContainer />
            <ServiceWorkerRegister />
          </MaintenanceModechecker>
        </CartProvider>
      </body>
    </html>
  );
}
