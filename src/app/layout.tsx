import "./globals.css";
import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Non-Printable Unicode Viewer & Cleaner",
  description: "Paste or upload text to visualize and remove invisible/non-printable Unicode characters.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="container" style={{ paddingTop: 12, paddingBottom: 0 }}>
          <div className="header">
            <ThemeToggle />
          </div>
        </div>
        {children}
      </body>
    </html>
  );
} 