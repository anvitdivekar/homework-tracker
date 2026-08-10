import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Homework Tracker",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui", margin: 0, padding: "20px", backgroundColor: "#f9f7f1" }}>
        {children}
      </body>
    </html>
  );
}
