import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal Internal Blockchain Ijazah",
  description: "Sistem Manajemen Penerbitan Ijazah Berbasis Blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <div className="animated-bg"></div>
        {children}
      </body>
    </html>
  );
}
