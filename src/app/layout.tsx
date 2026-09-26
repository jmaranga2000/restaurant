import type { Metadata, Viewport } from "next";
import { PwaRegistration } from "@/components/ui/PwaRegistration";
import { PwaInstallPrompt } from "@/components/ui/PwaInstallPrompt";
import "./globals.css";

// Dashboard routes read the active session and live operational data. Rendering
// them per request avoids build-time attempts to access those private resources.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Restaurant OS",
  description: "Multi-branch restaurant management & POS platform",
  applicationName: "Restaurant OS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/logo5.png",
    apple: "/icons/logo5.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Restaurant OS",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5FBFF" },
    { media: "(prefers-color-scheme: dark)", color: "#082C46" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try { const theme = localStorage.getItem("restaurant-os-theme"); if (theme === "dark") { document.documentElement.classList.add("dark"); document.documentElement.style.colorScheme = "dark"; } } catch {}`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-paper text-ink font-sans antialiased">
        <PwaRegistration />
        <PwaInstallPrompt />
        {children}
      </body>
    </html>
  );
}
