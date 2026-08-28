import type { Metadata } from "next";
import "./globals.css";

// WHAT A PASTED LINK LOOKS LIKE, which for a party game is the entire distribution channel.
//
// `metadataBase` is what turns the generated card's relative path into the absolute URL every
// unfurler requires. Without it Next emits a relative og:image, iMessage ignores it, and the card
// renders with no picture while nothing errors anywhere — no console, no network tab, no Vercel
// log. The image itself is src/app/opengraph-image.tsx.
const SITE = "https://whatshuman.vercel.app";

const BLURB =
  "Can you tell human writing from AI writing? Vote on short phrases and see how you compare.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Human or AI? - A perception game for the LLM era",
  description: BLURB,
  applicationName: "Human or AI?",
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Human or AI?",
    title: "Human or AI?",
    description: BLURB,
  },
  twitter: {
    // Was "summary", the small square variant, which renders a thumbnail beside the text instead
    // of the full-width card a 1200x630 image is drawn for.
    card: "summary_large_image",
    title: "Human or AI?",
    description: BLURB,
  },
  themeColor: "#0d1117",
  // Without this a saved copy opens inside Safari's chrome. `title` is the label under the icon:
  // the short name, not the <title>, because iOS truncates at roughly twelve characters.
  appleWebApp: {
    capable: true,
    title: "Human or AI",
    statusBarStyle: "black-translucent",
  },
  // Next emits only the standardised `mobile-web-app-capable`. Current Safari honours the
  // manifest's display:"standalone", so this is belt and braces — but older iOS reads only this
  // spelling and the failure it prevents is silent.
  other: { "apple-mobile-web-app-capable": "yes" },
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
