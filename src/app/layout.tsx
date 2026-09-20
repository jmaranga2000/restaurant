import type { Metadata, Viewport } from "next";
import { PwaRegistration } from "@/components/ui/PwaRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Restaurant OS",
  description: "Multi-branch restaurant management & POS platform",
  applicationName: "Restaurant OS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/restaurant-os.svg",
    apple: "/icons/restaurant-os.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Restaurant OS",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#14181D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-paper text-ink font-sans antialiased">
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
