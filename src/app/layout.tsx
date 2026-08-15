import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import GlobalLoader from "@/components/layout/GlobalLoader";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERP Sabore",
  description: "Sistema ERP Empresarial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${publicSans.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Suspense fallback={null}>
          <GlobalLoader />
        </Suspense>
      </body>
    </html>
  );
}
