"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isPersonaPage = pathname.startsWith("/persona");

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Background layer that can be blurred */}
      <div
        className="fixed inset-0 bg-[url('/bg_mobile.jpg')] md:bg-[url('/bg_pc.jpg')] bg-cover bg-center -z-10"
        data-background-blur
      />
      
      {/* Conditionally render Navbar */}
      {!isPersonaPage && <Navbar />}
      
      {/* Main content with conditional padding */}
      <div 
        className={isPersonaPage ? "" : "mt-20 md:mt-0 mb-10 md:mb-0"} 
        data-main-content
      >
        {children}
      </div>
      
      {/* Conditionally render Footer */}
      {!isPersonaPage && <Footer />}
    </div>
  );
}