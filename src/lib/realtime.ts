/**
 * Domain events the app publishes. Keep this list in sync with section 12
 * of the platform spec — anything not named here shouldn't be published.
 */
export const REALTIME_EVENTS = {
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_CONFIRMED: "ORDER_CONFIRMED",
  ORDER_PREPARING: "ORDER_PREPARING",
  ORDER_READY: "ORDER_READY",
  ORDER_COMPLETED: "ORDER_COMPLETED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  PAYMENT_CREATED: "PAYMENT_CREATED",
  PAYMENT_REFUNDED: "PAYMENT_REFUNDED",
  INVENTORY_LOW: "INVENTORY_LOW",
  STOCK_RECEIVED: "STOCK_RECEIVED",
  DISPLAY_CONTENT_UPDATED: "DISPLAY_CONTENT_UPDATED",
} as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export interface RealtimeEvent<T = unknown> {
  name: RealtimeEventName;
  organizationId: string;
  branchId: string;
  data: T;
  occurredAt: string;
}

/**
 * A channel is always scoped to one branch, e.g. "branch:665f...:kitchen" or
 * "branch:665f...:display". Scoping at the channel level means a compromised
 * or misconfigured client can only ever subscribe to its own branch's feed.
 */
export function branchChannel(branchId: string, stream: "kitchen" | "pos" | "display" | "ops"): string {
  return `branch:${branchId}:${stream}`;
}

export interface RealtimeProvider {
  publish(channel: string, event: RealtimeEvent): Promise<void>;
}

type RealtimeListener = (event: RealtimeEvent) => void;

const localListeners = new Map<string, Set<RealtimeListener>>();

/** Subscribe to events in this server process. SSE uses this for live displays. */
export function subscribeToChannel(channel: string, listener: RealtimeListener): () => void {
  const listeners = localListeners.get(channel) ?? new Set<RealtimeListener>();
  listeners.add(listener);
  localListeners.set(channel, listeners);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) localListeners.delete(channel);
  };
}

function emitLocalEvent(channel: string, event: RealtimeEvent): void {
  localListeners.get(channel)?.forEach((listener) => listener(event));
}

/**
 * Swap this adapter to change providers (Ably, Pusher, self-hosted
 * Socket.IO, Upstash Redis pub/sub, ...) without touching any service or
 * action code — they only ever call publishEvent() below.
 */
class AblyRealtimeProvider implements RealtimeProvider {
  async publish(channel: string, event: RealtimeEvent): Promise<void> {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.warn("ABLY_API_KEY not set — realtime publish skipped:", channel, event.name);
      return;
    }
    // Implementation note: call Ably's REST publish endpoint here (or use
    // the `ably` SDK's REST client) with the channel + event payload.
    // Kept as an explicit integration point rather than a fake network
    // call, since this environment has no outbound network access.
  }
}

let provider: RealtimeProvider | null = null;

function getProvider(): RealtimeProvider {
  if (!provider) provider = new AblyRealtimeProvider();
  return provider;
}

export async function publishEvent<T>(
  name: RealtimeEventName,
  channel: string,
  organizationId: string,
  branchId: string,
  data: T
): Promise<void> {
  const event = {
    name,
    organizationId,
    branchId,
    data,
    occurredAt: new Date().toISOString(),
  } satisfies RealtimeEvent<T>;
  await getProvider().publish(channel, event);
  emitLocalEvent(channel, event);
}
