import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OASIS BI PRO x Barbershop Data Monetization",
  description: "Real-time business intelligence dashboard untuk barbershop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
