import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Royal Services - Agent Updates & Token Management Portal",
  description:
    "Official administration and verification portal for Royal Services service tokens, agent assignments, and property tracking.",
  openGraph: {
    title: "Royal Services – Official Service Token Registry",
    description:
      "Verify authenticated Royal Services property assignments, validity periods, and approved public records in real time.",
    type: "website",
    locale: "en_IN",
    siteName: "Royal Services",
  },
  twitter: {
    card: "summary",
    title: "Royal Services – Service Token Registry",
    description: "Verify Royal Services property tokens and agent assignments in real time.",
  },
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
