import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

import Navigation from "@/components/layout/Navigation";
import { CompanionProvider } from "@/context/CompanionContext";
import { BRAND } from "@/lib/brand";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${BRAND.appName} | Your AI Gardening Companion`,
  description: `A friendly ${BRAND.assistantSpecies} helps you grow healthy plants indoors and out.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${inter.variable}`}>
        <CompanionProvider>
          <Navigation />
          {children}
        </CompanionProvider>
      </body>
    </html>
  );
}