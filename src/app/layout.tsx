import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Mordern Design Tool Landing Page",
  description: "Created with the help of Fronted Tribe",
};

export default function RootLayout({
  children,  
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (  
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-neutral-950 text-white pb-2[10000px]`}
      >
        {children}
      </body>
    </html>
  );
}
