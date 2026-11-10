import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <div className="animated-bg"></div>
        {children}
      </body>
    </html>
  );
}
