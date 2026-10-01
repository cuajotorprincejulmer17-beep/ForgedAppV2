import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FORGED — Better conversations. Stronger communities.",
  description:
    "FORGED is a real-time home for your communities: chat, voice, and the people who make it worth showing up.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
