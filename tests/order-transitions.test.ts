import { describe, it, expect } from "vitest";
import { canTransition } from "@/types/order";

describe("order status transitions", () => {
  it("allows the normal dine-in happy path", () => {
    expect(canTransition("DRAFT", "PLACED")).toBe(true);
    expect(canTransition("PLACED", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "PREPARING")).toBe(true);
    expect(canTransition("PREPARING", "READY")).toBe(true);
    expect(canTransition("READY", "SERVED")).toBe(true);
    expect(canTransition("SERVED", "COMPLETED")).toBe(true);
  });

  it("rejects skipping straight from PLACED to READY", () => {
    expect(canTransition("PLACED", "READY")).toBe(false);
  });

  it("rejects reviving a cancelled order", () => {
    expect(canTransition("CANCELLED", "PLACED")).toBe(false);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
  });

  it("allows cancelling up until preparation is underway", () => {
    expect(canTransition("PLACED", "CANCELLED")).toBe(true);
    expect(canTransition("CONFIRMED", "CANCELLED")).toBe(true);
    expect(canTransition("PREPARING", "CANCELLED")).toBe(true);
  });

  it("disallows cancelling once an order is ready or served", () => {
    expect(canTransition("READY", "CANCELLED")).toBe(false);
    expect(canTransition("SERVED", "CANCELLED")).toBe(false);
  });

  it("only allows refunding a completed order", () => {
    expect(canTransition("COMPLETED", "REFUNDED")).toBe(true);
    expect(canTransition("READY", "REFUNDED")).toBe(false);
  });
});
