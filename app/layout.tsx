import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saree Try On",
  description:
    "Pick a drape, upload a saree photo, and see it draped in the browser.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
