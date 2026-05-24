import type { ReactNode } from "react";
import "./styles.css";

export const metadata = {
  title: "Rikka Studio — Prompt experiments, cleanly documented",
  description:
    "A small web workspace for testing prompts, reviewing model outputs, and exporting reusable notes through any OpenAI-compatible API.",
  metadataBase: new URL("https://rikka-studio.vercel.app"),
  openGraph: {
    title: "Rikka Studio",
    description:
      "Prompt experiments, cleanly documented. Test prompts and export markdown via OpenAI-compatible APIs.",
    url: "https://rikka-studio.vercel.app",
    siteName: "Rikka Studio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rikka Studio",
    description:
      "Prompt experiments, cleanly documented. Test prompts and export markdown via OpenAI-compatible APIs.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
