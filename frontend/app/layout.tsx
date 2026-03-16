import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

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
    <html lang="en">
      <body className="bg-black font-body text-text-primary antialiased">
        <Providers>
          <div className="page-enter">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
