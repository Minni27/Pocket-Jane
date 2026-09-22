import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import Navigation from "@/components/nav/Navigation";
import RegisterSW from "@/components/pwa/RegisterSW";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pocket Jane",
  description: "Real-time psychological profiling and persuasion intelligence.",
  applicationName: "Pocket Jane",
  appleWebApp: {
    capable: true,
    title: "Jane",
    // "default" keeps the status bar legible in both themes; "black-translucent"
    // would let content slide under the clock on notched phones.
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Installed PWAs should not rubber-band-zoom like a web page, but capping
  // it entirely blocks pinch-zoom on captured photos, so allow up to 5x.
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#07060a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <RegisterSW />
        <ThemeProvider>
          <Navigation />
          <main className="flex-1 flex flex-col relative z-[1]">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
