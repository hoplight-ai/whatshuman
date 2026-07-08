import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Human or AI? - A perception game for the LLM era",
  description:
    "Can you tell human writing from AI writing? Vote on short phrases and see how you compare.",
  openGraph: {
    title: "Human or AI?",
    description: "Can you tell the difference?",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Human or AI?",
    description: "A perception game for the LLM era.",
  },
  themeColor: "#0d1117",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
