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
  title: {
    default: "How Scary - AI-Powered Scary Ratings for Movies, Books & More",
    template: "%s | How Scary"
  },
  description: "Discover how scary movies, books, games, and more really are. Get AI-powered scary ratings across multiple dimensions including jump scares, gore, psychological horror, and more.",
  keywords: [
    "how scary",
    "scary rating",
    "horror rating",
    "scary score",
    "horror movie rating",
    "scary book rating",
    "fear factor",
    "jump scare rating",
    "gore rating",
    "psychological horror"
  ],
  authors: [{ name: "How Scary" }],
  creator: "How Scary",
  publisher: "How Scary",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "How Scary - AI-Powered Scary Ratings",
    description: "Discover how scary movies, books, games, and more really are with our AI-powered analysis.",
    url: "https://howscary.com",
    siteName: "How Scary",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How Scary - AI-Powered Scary Ratings",
    description: "Discover how scary movies, books, games, and more really are with our AI-powered analysis.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
          <footer className="mt-16 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                © 2024 How Scary Wiki. Community-driven scary ratings for everything.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
