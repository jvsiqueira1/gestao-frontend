import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { LoadingProvider } from "../context/LoadingContext";
import ReactQueryProvider from "../components/ReactQueryProvider";
import ThemeGate from "../components/ThemeGate";
import AppShell from "../components/AppShell";
import AuthGate from "../components/AuthGate";
import InstallPWA from "../components/InstallPWA";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestão de Gastos",
  description: "Controle financeiro pessoal — single user.",
  applicationName: "Gestão de Gastos",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gastos",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <ThemeGate>
          <ReactQueryProvider>
            <ThemeProvider>
              <LoadingProvider>
                <AuthProvider>
                  <AuthGate />
                  <AppShell>{children}</AppShell>
                  <InstallPWA />
                </AuthProvider>
              </LoadingProvider>
            </ThemeProvider>
          </ReactQueryProvider>
        </ThemeGate>
      </body>
    </html>
  );
}
