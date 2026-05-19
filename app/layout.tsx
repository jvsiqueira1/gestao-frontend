import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { AppearanceProvider } from "../context/AppearanceContext";
import { LoadingProvider } from "../context/LoadingContext";
import ReactQueryProvider from "../components/ReactQueryProvider";
import ThemeGate from "../components/ThemeGate";
import AppShell from "../components/AppShell";
import AuthGate from "../components/AuthGate";
import InstallPWA from "../components/InstallPWA";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

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
    { media: "(prefers-color-scheme: light)", color: "#fbfbfb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      data-theme="light"
      data-density="compact"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${jetbrains.variable}`}
    >
      <body>
        <ThemeGate>
          <ReactQueryProvider>
            <AppearanceProvider>
              <LoadingProvider>
                <AuthProvider>
                  <AuthGate />
                  <AppShell>{children}</AppShell>
                  <InstallPWA />
                </AuthProvider>
              </LoadingProvider>
            </AppearanceProvider>
          </ReactQueryProvider>
        </ThemeGate>
      </body>
    </html>
  );
}
