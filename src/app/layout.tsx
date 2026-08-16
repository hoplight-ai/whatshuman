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

// Which commit is actually live. Vercel sets this at build time; a local build
// leaves it undefined, so the tag reads "dev". Without it there is no way to tell
// from outside whether a push produced a deployment, which is exactly how this
// project served stale code for two months after its git link was repointed.
const BUILD_SHA = process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="x-build-sha" content={BUILD_SHA} />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
