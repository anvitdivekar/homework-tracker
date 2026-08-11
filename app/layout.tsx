import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Homework Tracker",
  manifest: "/manifest.json",
  themeColor: "#1e3a5f",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui", margin: 0, padding: "20px", backgroundColor: "#f9f7f1" }}>
        {children}
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
