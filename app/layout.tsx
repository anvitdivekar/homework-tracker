import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

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
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
