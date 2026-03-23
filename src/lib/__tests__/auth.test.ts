// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("server-only", () => ({}));

import { createSession } from "@/lib/auth";

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.NODE_ENV;
});

test("createSession sets an httpOnly cookie named auth-token", async () => {
  await createSession("user-1", "user@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, token, options] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(typeof token).toBe("string");
  expect(token.length).toBeGreaterThan(0);
  expect(options.httpOnly).toBe(true);
  expect(options.path).toBe("/");
  expect(options.sameSite).toBe("lax");
});

test("createSession sets secure=false outside production", async () => {
  process.env.NODE_ENV = "development";
  await createSession("user-1", "user@example.com");
  const [, , options] = mockCookieStore.set.mock.calls[0];
  expect(options.secure).toBe(false);
});

test("createSession sets secure=true in production", async () => {
  process.env.NODE_ENV = "production";
  await createSession("user-1", "user@example.com");
  const [, , options] = mockCookieStore.set.mock.calls[0];
  expect(options.secure).toBe(true);
});

test("createSession sets expiry ~7 days in the future", async () => {
  const before = Date.now();
  await createSession("user-1", "user@example.com");
  const after = Date.now();

  const [, , options] = mockCookieStore.set.mock.calls[0];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const expiresMs = options.expires.getTime();

  expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expiresMs).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession produces a signed JWT token", async () => {
  await createSession("user-1", "user@example.com");
  const [, token] = mockCookieStore.set.mock.calls[0];
  // JWTs have three base64url segments separated by dots
  expect(token.split(".")).toHaveLength(3);
});
