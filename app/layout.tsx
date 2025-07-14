import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { ColorThemeProvider } from "../context/ColorThemeContext";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import ChatbotWrapper from "../components/ChatbotWrapper";
import ReactQueryProvider from "../components/ReactQueryProvider";
import ThemeGate from "../components/ThemeGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestão de Gastos | Controle Financeiro",
  description: "Gerencie suas finanças pessoais de forma simples e eficiente. Controle gastos, receitas e metas financeiras.",
  keywords: [
    "finanças",
    "controle financeiro",
    "gastos",
    "receitas",
    "metas",
    "organização financeira",
    "app de finanças",
    "gestão de gastos"
  ],
  openGraph: {
    title: "Gestão de Gastos | Controle Financeiro",
    description: "Gerencie suas finanças pessoais de forma simples e eficiente.",
    url: "https://gestao.jvsdev.com.br", 
    siteName: "Gestão de Gastos",
    images: [
      {
        url: "/favicon-32x32.png", 
        width: 800,
        height: 600,
        alt: "Logo do app",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gestão de Gastos | Controle Financeiro",
    description: "Gerencie suas finanças pessoais de forma simples e eficiente.",
    images: ["/favicon-32x32.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Outros elementos do <head> (sem script de tema) */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
        <ThemeGate>
          <ReactQueryProvider>
            <ThemeProvider>
              <ColorThemeProvider>
                <AuthProvider>
                  <div className="min-h-screen flex flex-col">
                    <ThemeGate>
                      <NavBar />
                    </ThemeGate>
                    <main className="flex-1">
                      {children}
                    </main>
                    <Footer />
                  </div>
                  <ChatbotWrapper />
                </AuthProvider>
              </ColorThemeProvider>
            </ThemeProvider>
          </ReactQueryProvider>
        </ThemeGate>
      </body>
    </html>
  );
}
