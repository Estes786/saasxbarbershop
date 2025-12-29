import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ToastProvider } from "@/lib/context/ToastContext";

export const metadata: Metadata = {
  title: "BALIK.LAGI - Platform Manajemen Barbershop",
  description: "Sekali Cocok, Pengen Balik Lagi. Platform SaaS untuk barbershop yang bikin pelanggan loyal.",
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
