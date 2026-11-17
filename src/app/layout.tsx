import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { getI18n } from "@/i18n";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Ameen | أمين", template: "%s · Ameen | أمين" },
  description: "منشأتك في أيدٍ أمينة · Your facilities, in trusted hands",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/brand/ameen-app-icon.svg", apple: "/brand/icon-192.png" },
  appleWebApp: { capable: true, title: "Ameen", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#4E7A6E", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, dir } = await getI18n();
  return (
    <html lang={locale} dir={dir} className={`${plex.variable} ${inter.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
