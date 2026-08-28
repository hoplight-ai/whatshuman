// The web manifest, which is what makes this installable rather than merely bookmarkable.
//
// Without one, iOS labels the home-screen icon from <title>: "Human or AI? - A perception game for
// the LLM era" arrived truncated at roughly twelve characters. `short_name` is the fix.
//
// `display: "standalone"` plus the appleWebApp block in layout.tsx is what makes a saved copy open
// full screen rather than inside Safari's chrome — which matters here more than most, because this
// is passed around a room on phones.

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Human or AI? — a perception game for the LLM era",
    short_name: "Human or AI",
    description:
      "Can you tell human writing from AI writing? Vote on short phrases and see how you compare.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // The app's own ground, so the splash screen is the app rather than a white flash.
    background_color: "#0d1117",
    theme_color: "#0d1117",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
