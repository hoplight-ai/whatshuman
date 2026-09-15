// The manifest's 192 and 512 icons.
//
// WHY A ROUTE AND NOT src/app/icon.tsx. Next's file convention emits content-hashed URLs, which is
// right for the <link rel="icon"> tags it writes for you and useless in a web manifest, where the
// icon `src` has to be a stable string. These two are addressed by size and never move.

import { ImageResponse } from "next/og";
import HumanAiMark from "@/components/HumanAiMark";

// Only the two sizes a manifest asks for. Anything else 404s rather than quietly rendering, so a
// typo in manifest.ts fails loudly instead of shipping a blank tile.
const SIZES = [192, 512] as const;

export function generateStaticParams() {
  return SIZES.map((s) => ({ size: String(s) }));
}

export const dynamicParams = false;

export async function GET(_request: Request, props: { params: Promise<{ size: string }> }) {
  const params = await props.params;
  const px = Number(params.size);
  if (!SIZES.includes(px as (typeof SIZES)[number])) {
    return new Response("Not found", { status: 404 });
  }

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
        {/* 0.7 of the tile, matching the 126/180 the apple icon uses. */}
        <HumanAiMark size={Math.round(px * 0.7)} />
      </div>
    ),
    { width: px, height: px }
  );
}
