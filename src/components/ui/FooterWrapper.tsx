"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  // Don't show footer on payment page
  if (pathname === "/payment") {
    return null;
  }

  return <Footer />;
}
