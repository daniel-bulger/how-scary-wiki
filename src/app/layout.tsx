import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "How Scary Wiki",
  description: "The ultimate guide to rating how scary things are across multiple dimensions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <AuthProvider>
          <Header />
          <main className="container mx-auto px-4 py-6 md:py-10">
            {children}
          </main>
          <footer className="mt-16 border-t border-gray-200 bg-white">
            <div className="container mx-auto px-4 py-8">
              <p className="text-center text-sm text-gray-600">
                © 2024 How Scary Wiki. Community-driven scary ratings for everything.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
