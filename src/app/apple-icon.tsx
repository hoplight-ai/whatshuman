// The home-screen icon, for when this gets saved to a phone.
//
// The app shipped with only src/app/favicon.ico, which iOS will not use. Saving the page to a home
// screen produced a blank tile with a screenshot of the page inside it, labelled from <title> —
// "Human or AI? - A perception game for the LLM era", truncated to about twelve characters.
//
// No rounded corners on purpose: iOS masks the tile itself, and one that arrives pre-rounded gets
// rounded twice and ends up with a pale fringe.

import { ImageResponse } from "next/og";
import HumanAiMark from "@/components/HumanAiMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1117",
        }}
      >
        <HumanAiMark size={126} />
      </div>
    ),
    size
  );
}
