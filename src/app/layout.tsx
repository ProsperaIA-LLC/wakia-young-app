import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prospera Young AI",
  description: "Programa intensivo de 6 semanas para jóvenes latinos que construyen productos con IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
