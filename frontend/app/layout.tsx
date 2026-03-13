import type { Metadata } from "next";
import {
  DM_Serif_Display,
  DM_Mono,
  Space_Mono,
} from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClearClaim",
  description: "Autonomous Insurance Navigation Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSerif.variable} ${dmMono.variable} ${spaceMono.variable}`}
    >
      <body className="bg-navy font-mono text-text-primary antialiased">
        <Providers>
          <div className="page-enter">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
