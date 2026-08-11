import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homework Tracker",
  manifest: "/manifest.json",
  themeColor: "#1a2e4a",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="app-shell">
          {children}
        </div>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            }
          `
        }} />
      </body>
    </html>
  );
}
