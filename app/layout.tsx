import "./globals.css";
import type { Metadata } from "next";
import Topbar from "../components/Topbar";

export const metadata: Metadata = {
  title: "Triunfo UI Forge",
  description: "PWA que descreve UI a partir de imagem (on-device)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0EA5E9" />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        <Topbar />
        {children}
      </body>
    </html>
  );
}
