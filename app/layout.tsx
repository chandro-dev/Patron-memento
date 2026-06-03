import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patron Memento | Demo interactiva",
  description:
    "Aplicacion interactiva en TypeScript para explicar el patron de diseno Memento sin backend.",
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
