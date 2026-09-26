import { ImageResponse } from "next/og";

export const runtime = "edge";

const supportedSizes = new Set([192, 512]);

export async function GET(request: Request, { params }: { params: { size: string } }) {
  const requestedSize = Number.parseInt(params.size, 10);
  const size = supportedSizes.has(requestedSize) ? requestedSize : 512;
  const logoResponse = await fetch(new URL("/icons/logo5.png", request.url));
  if (!logoResponse.ok) return new Response("Logo not found", { status: 404 });

  const logoBytes = new Uint8Array(await logoResponse.arrayBuffer());
  let logoBinary = "";
  for (let offset = 0; offset < logoBytes.length; offset += 0x8000) {
    logoBinary += String.fromCharCode(...logoBytes.subarray(offset, offset + 0x8000));
  }
  const logoData = `data:image/png;base64,${btoa(logoBinary)}`;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#F5FBFF",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <img src={logoData} width={size} height={size} style={{ objectFit: "contain" }} />
      </div>
    ),
    { width: size, height: size }
  );
}
