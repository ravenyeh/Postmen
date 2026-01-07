import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Threads 貼文產生器",
  description: "AI 驅動的高流量 Threads 貼文創作工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
