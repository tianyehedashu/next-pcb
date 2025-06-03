import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { ChatwootWidget } from "@/components/ChatwootWidget";
import { FloatingCustomerServiceButton } from "@/components/FloatingCustomerServiceButton";

import Providers from '@/app/components/Providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        <Navbar />
        <Providers>
          {children}
        </Providers>
        <Footer />
        <ChatwootWidget />
        <FloatingCustomerServiceButton />
      </body>
    </html>
  );
}

