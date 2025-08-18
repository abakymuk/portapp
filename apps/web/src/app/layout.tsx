import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PortOps MVP",
  description: "Система управления портовыми операциями",
};

// Проверка переменных окружения на сервере
if (typeof window === "undefined") {
  console.log("🚀 Server environment check:", {
    SUPABASE_URL: env.SUPABASE_URL,
    DEFAULT_TZ: env.DEFAULT_TZ,
    NODE_ENV: env.NODE_ENV,
    // Не логируем секреты!
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
