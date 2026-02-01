import "~/frontend/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { Inter } from "next/font/google"
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

/**
 * Inter フォント設定オブジェクト。
 *
 * @remarks
 * - `subsets` は読み込む文字セット（グリフのサブセット）を指定します。例: "latin", "latin-ext", "cyrillic"。
 *   指定することで不要な文字セットを除外し、フォントファイルの読み込みサイズを削減できます。
 * - `variable` はフォントを参照するための CSS カスタムプロパティ名（またはクラス名）です。
 * - このオブジェクトは next/font/google 等のフォントユーティリティが返すフォント定義です。
 *
 * @constant
 */
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
    <html lang="ja" className={`${GeistSans.variable} ${inter.variable}`}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
