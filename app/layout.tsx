import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import ChatbotWrapper from "../components/ChatbotWrapper";
import ReactQueryProvider from "../components/ReactQueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestão de Gastos",
  description: "App de gestão de finanças",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ReactQueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <div className="min-h-screen flex flex-col">
                <NavBar />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
              <ChatbotWrapper />
            </AuthProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
