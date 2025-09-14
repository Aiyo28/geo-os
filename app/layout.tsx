import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "inDrive Geo-OS",
  description: "Geo-optimization platform for inDrive",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
