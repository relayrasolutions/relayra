import React from 'react';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/index.css";
import "@/styles/tailwind.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Relayra Solutions — Managed WhatsApp Automation for Schools",
  description: "Automate fee collection, parent communication, and attendance tracking via WhatsApp. Managed service for Indian private schools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#F8FAFC' }}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '8px', fontSize: '14px' },
              success: { style: { background: '#10B981', color: '#fff' } },
              error: { style: { background: '#EF4444', color: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}