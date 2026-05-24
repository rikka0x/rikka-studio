import type { ReactNode } from "react";
import "./styles.css";

export const metadata = {
  title: "Rikka Studio",
  description: "A clean prompt workspace for OpenAI-compatible model APIs.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
