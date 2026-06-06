/**
 * @file src/app/layout.tsx
 * @description Root layout component that provides foundational context (Auth, PWA, Analytics) to the entire application.
 * Requirement: Ensures all pages have access to authentication state, PWA lifecycle management, and performance monitoring.
 */

import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegistration from "@/components/PWARegistration";
import InstallPrompt from "@/components/InstallPrompt";
import OfflineIndicator from "@/components/OfflineIndicator";
import PWAUpdatePrompt from "@/components/pwa/PWAUpdatePrompt";
import OfflineSyncProvider from "@/components/pwa/OfflineSyncProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Analytics } from "@/lib/monitoring";
import NavigationRail from "@/components/ui/NavigationRail";
import MobileNavigation from "@/components/ui/MobileNavigation";
import GlobalWorkGuard from "@/components/ui/GlobalWorkGuard";
import MainLayoutWrapper from "@/components/ui/MainLayoutWrapper";
import GlobalHeader from "@/components/ui/GlobalHeader";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "kulika | Roots of Heritage",
  description: "AI-powered family heritage documentation system",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Roots",
    startupImage: "/icons/apple-touch-icon.png",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    other: [
      {
        rel: "mask-icon",
        url: "/icons/apple-touch-icon.png",
        color: "#2563eb",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Track page view event for analytics
  Analytics.track({ event: 'page_view' }).catch(console.error);

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Roots" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body
        className={`min-h-full flex flex-col`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <OfflineSyncProvider />
          <OfflineIndicator />
          <InstallPrompt />
          <PWARegistration />
          <PWAUpdatePrompt />
          <NavigationRail />
          <MobileNavigation />
          <GlobalWorkGuard />
          <GlobalHeader />
          <MainLayoutWrapper>
            {children}
          </MainLayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
