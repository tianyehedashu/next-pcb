import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { Toaster } from "sonner";
import Providers from '@/app/components/Providers';
import { ChatwootProvider } from '@/app/components/ChatwootProvider';

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
        <ChatwootProvider>
          <Providers>
            <Navbar />
            {children}
            <Footer />
          </Providers>
        </ChatwootProvider>
        <Toaster />
      </body>
    </html>
  );
}

