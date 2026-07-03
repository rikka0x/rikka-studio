import type { ReactNode } from "react";
import "./styles.css";

export const metadata = {
  title: "Rikka Studio — Private prompt testing with your own API key",
  description:
    "An open-source prompt workspace for developers. Bring your own API key, test against any OpenAI-compatible model, and export results as markdown. Keys stay in your browser, never on the server.",
  metadataBase: new URL("https://rikka-studio.vercel.app"),
  icons: {
    icon: "/logo.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Rikka Studio — Private Prompt Testing",
    description:
      "Bring your own API key, test against any OpenAI-compatible model, and export results as markdown. Private by default.",
    url: "https://rikka-studio.vercel.app",
    siteName: "Rikka Studio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rikka Studio — Private Prompt Testing",
    description:
      "Bring your own API key, test against any OpenAI-compatible model, and export results as markdown.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
