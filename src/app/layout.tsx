import "~/frontend/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { Inter } from "next/font/google"
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "TABIRUN",
  description: "",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${inter.variable}`}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
