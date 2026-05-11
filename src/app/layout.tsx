import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWARegistration from "@/components/PWARegistration";
import OfflineIndicator from "@/components/OfflineIndicator";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "kulika | Roots of Heritage",
  description: "AI-powered family heritage documentation system",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Roots",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <OfflineIndicator />
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}
