import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ToastProvider } from "@/lib/context/ToastContext";

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
      <body className="antialiased">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
