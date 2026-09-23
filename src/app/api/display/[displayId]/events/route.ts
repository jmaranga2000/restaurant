import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { BranchModel } from "@/models/Branch";
import { branchChannel, subscribeToChannel, type RealtimeEvent } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { displayId: string } }) {
  await connectToDatabase();
  const branch = await BranchModel.findOne({ customerDisplayKey: params.displayId, isActive: true }).select("_id").lean();
  if (!branch) return NextResponse.json({ error: "Display not found." }, { status: 404 });

  const channel = branchChannel(String(branch._id), "display");
  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: RealtimeEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      controller.enqueue(encoder.encode(": connected\n\n"));
      unsubscribe = subscribeToChannel(channel, send);
      heartbeat = setInterval(() => controller.enqueue(encoder.encode(": heartbeat\n\n")), 15000);
      request.signal.addEventListener("abort", () => {
        if (heartbeat) clearInterval(heartbeat);
        unsubscribe();
        try { controller.close(); } catch { /* stream already closed */ }
      });
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}