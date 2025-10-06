import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { type FetchOptions, fetchWithRetry } from "../src/utils/http";

// Mock the fetch function
const originalFetch = global.fetch;
const mockFetch = (mockResponse: Response | Error, times = 1) => {
  let callCount = 0;

  return spyOn(global, "fetch").mockImplementation(async () => {
    callCount++;

    if (callCount <= times && mockResponse instanceof Error) {
      throw mockResponse;
    }

    if (mockResponse instanceof Response) {
      return mockResponse;
    }

    throw new Error("Invalid mock response");
  });
};

// Mock the setTimeout function
const originalSetTimeout = global.setTimeout;
const mockSetTimeout = () => {
  return spyOn(global, "setTimeout").mockImplementation((callback) => {
    // Immediately invoke callback to speed up tests
    if (typeof callback === "function") {
      callback();
    }
    return 0 as unknown as NodeJS.Timeout;
  });
};

// Mock console methods to reduce noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const mockConsoleMethods = () => {
  console.log = () => {};
  console.error = () => {};
};

describe("fetchWithRetry", () => {
  beforeEach(() => {
    mockConsoleMethods();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.setTimeout = originalSetTimeout;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  test("should return response immediately if successful", async () => {
    const successResponse = new Response("OK", { status: 200 });
    const fetchSpy = mockFetch(successResponse);

    const result = await fetchWithRetry("https://example.com");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(await result.text()).toBe("OK");
    expect(result.status).toBe(200);
  });

  test("should retry on specified HTTP status codes", async () => {
    const badResponse = new Response("Gateway Timeout", { status: 502 });
    const goodResponse = new Response("OK", { status: 200 });

    let callCount = 0;
    const fetchSpy = spyOn(global, "fetch").mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return badResponse;
      }
      return goodResponse;
    });

    const timeoutSpy = mockSetTimeout();

    const result = await fetchWithRetry("https://example.com", {
      retryOn: [502],
      maxRetries: 3,
      retryDelay: 100,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(timeoutSpy).toHaveBeenCalledTimes(1);
    expect(await result.text()).toBe("OK");
  });

  test("should retry on network errors", async () => {
    const networkError = new Error("Network error");
    const goodResponse = new Response("OK", { status: 200 });

    let callCount = 0;
    const fetchSpy = spyOn(global, "fetch").mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw networkError;
      }
      return goodResponse;
    });

    const timeoutSpy = mockSetTimeout();

    const result = await fetchWithRetry("https://example.com", {
      maxRetries: 3,
      retryDelay: 100,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(timeoutSpy).toHaveBeenCalledTimes(1);
    expect(await result.text()).toBe("OK");
  });

  test("should stop retrying after maxRetries is reached", async () => {
    const maxRetries = 3;
    const networkError = new Error("Network error");
    const fetchSpy = mockFetch(networkError, maxRetries + 1);
    const timeoutSpy = mockSetTimeout();

    await expect(
      fetchWithRetry("https://example.com", {
        maxRetries,
        retryDelay: 100,
      }),
    ).rejects.toThrow("Network error");

    expect(fetchSpy).toHaveBeenCalledTimes(maxRetries);
    expect(timeoutSpy).toHaveBeenCalledTimes(maxRetries - 1);
  });

  test("should stop retrying after reaching either maxRetries or maxRetryTime", async () => {
    const maxRetries = 3;
    const networkError = new Error("Network error");
    const fetchSpy = mockFetch(networkError, maxRetries + 1);
    const timeoutSpy = mockSetTimeout();

    await expect(
      fetchWithRetry("https://example.com", {
        maxRetries,
        retryDelay: 100,
        maxRetryTime: 600000, // 10 minutes
      }),
    ).rejects.toThrow(); // Just expect any error

    // Either maxRetries or maxRetryTime could be reached first
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(0);
    expect(fetchSpy.mock.calls.length).toBeLessThanOrEqual(maxRetries);
  });
});
