import type { Metadata, Viewport } from "next";
import { GlobalThemeToggle } from "@/components/ui/GlobalThemeToggle";
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
        <GlobalThemeToggle />
        {children}
      </body>
    </html>
  );
}
