import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dr. Hair | Care Operations",
  description: "Dr. Hair clinical and care operations workspace",
  icons: {
    icon: [
      { url: "/icon-32x32.png?v=5", sizes: "32x32", type: "image/png" },
      { url: "/icon-16x16.png?v=5", sizes: "16x16", type: "image/png" },
      { url: "/icon-192x192.png?v=5", sizes: "192x192", type: "image/png" },
      { url: "/icon.png?v=5", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico?v=5", sizes: "any" },
    ],
    shortcut: "/favicon.ico?v=5",
    apple: [
      { url: "/apple-icon.png?v=5", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png?v=5" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png?v=5" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png?v=5" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon.png?v=5" />
        <link rel="shortcut icon" href="/favicon.ico?v=5" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png?v=5" />
      </head>
      <body>{children}</body>
    </html>
  );
}
