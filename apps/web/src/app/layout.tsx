import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { clientEnv, serverEnv } from "@/lib/env";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarToggle } from "@/components/layout/sidebar-toggle";
import { SidebarProvider } from "@/components/layout/sidebar-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PortOps - Управление портом",
  description: "Система мониторинга и управления портовыми операциями",
};

// Проверка переменных окружения на сервере
if (typeof window === "undefined") {
  console.log("🚀 Server environment check:", {
    SUPABASE_URL: clientEnv.SUPABASE_URL,
    DEFAULT_TZ: clientEnv.DEFAULT_TZ,
    NODE_ENV: clientEnv.NODE_ENV,
    // Не логируем секреты!
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col">
              {/* Header */}
              <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
                <SidebarToggle />
                <div className="flex-1" />
              </header>

              {/* Main content */}
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
