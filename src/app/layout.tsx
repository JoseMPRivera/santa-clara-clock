import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import "./controls.css";

const sans = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Santa Clara County time and weather",
  description: "The current time and a one-click weather check for Santa Clara County.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-sky="day" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
