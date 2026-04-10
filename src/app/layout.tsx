import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ESC-Internal Orders",
  description: "Système de gestion des commandes internes pour ESC Algérie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <div className="main-layout">
          {children}
        </div>
      </body>
    </html>
  );
}
