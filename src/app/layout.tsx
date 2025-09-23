import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sophia",
  description: "Where AI meets History",
};

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
        <AuthProvider>
          <div className="relative flex flex-col min-h-screen">
            {/* Background layer that can be blurred */}
            <div
              className="fixed inset-0 bg-[url('/bg_mobile.jpg')] md:bg-[url('/bg_pc.jpg')] bg-cover bg-center -z-10"
              data-background-blur
            />
            <Navbar />
            <div className="mt-20 md:mt-0 mb-10 md:mb-0" data-main-content>
              {children}
            </div>
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
