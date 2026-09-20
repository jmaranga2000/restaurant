import { ImageResponse } from "next/og";

export const runtime = "edge";

const supportedSizes = new Set([192, 512]);

export async function GET(_: Request, { params }: { params: { size: string } }) {
  const requestedSize = Number.parseInt(params.size, 10);
  const size = supportedSizes.has(requestedSize) ? requestedSize : 512;
  const markSize = Math.round(size * 0.5);

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #082C46 0%, #155C88 100%)",
          color: "#F5FBFF",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          fontSize: markSize,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          letterSpacing: -markSize * 0.08,
          width: "100%",
        }}
      >
        R
      </div>
    ),
    { width: size, height: size }
  );
}
