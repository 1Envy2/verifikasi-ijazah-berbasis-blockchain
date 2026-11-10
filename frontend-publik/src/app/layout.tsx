import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verifikasi Ijazah Publik",
  description: "Portal Cek Keaslian Ijazah Universitas Lampung",
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
