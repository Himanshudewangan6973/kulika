import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWARegistration from "@/components/PWARegistration";
import OfflineIndicator from "@/components/OfflineIndicator";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "kulika | Roots of Dewangan",
  description: "AI-powered family heritage documentation system",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
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
