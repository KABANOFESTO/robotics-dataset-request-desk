import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dataset Request Desk",
  description: "Manage dataset requests and episode assignments.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
