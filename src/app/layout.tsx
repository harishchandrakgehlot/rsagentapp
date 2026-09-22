import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Royal Services - Agent Updates & Token Management Portal",
  description:
    "Official administration and verification portal for Royal Services service tokens, agent assignments, and property tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
