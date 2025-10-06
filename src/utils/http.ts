/**
 * HTTP utility functions for making API requests with retry logic
 */

/**
 * Type definition for fetch options, extending the standard RequestInit
 */
export interface FetchOptions extends RequestInit {
  retryOn?: number[]; // HTTP status codes to retry on
  maxRetries?: number; // Maximum number of retry attempts
  retryDelay?: number; // Delay between retries in milliseconds
  maxRetryTime?: number; // Maximum total retry time in milliseconds
}

/**
 * Fetch with retry functionality for handling transient errors
 *
 * @param url - The URL to fetch
 * @param options - Fetch options with additional retry configuration
 * @returns Promise with the fetch response
 */
export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
  const {
    retryOn = [502], // Default to retry only on 502 errors
    maxRetries = 20, // Default to 20 retries (10 minutes with 30s delay)
    retryDelay = 30000, // Default to 30 seconds between retries
    maxRetryTime = 600000, // Default to 10 minutes maximum retry time
    ...fetchOptions
  } = options;

  let lastError: Error | undefined;
  const startTime = Date.now();
  let attempts = 0;

  while (attempts < maxRetries && Date.now() - startTime < maxRetryTime) {
    try {
      if (attempts > 0) {
        console.log(`Retry attempt ${attempts}/${maxRetries} for ${url}...`);
      }

      const response = await fetch(url, fetchOptions);

      // If the response status is in the retry list, throw an error to trigger retry
      if (retryOn.includes(response.status)) {
        const errorText = await response.text();
        const error = new Error(`Received status ${response.status}: ${errorText}`);
        throw error;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempts++;

      // If we've reached the maximum retries or time, throw the last error
      if (attempts >= maxRetries || Date.now() - startTime >= maxRetryTime) {
        console.error(`Max retries (${maxRetries}) or time (${maxRetryTime}ms) exceeded.`);
        throw lastError;
      }

      // Calculate remaining time to ensure we don't exceed maxRetryTime
      const remainingTime = maxRetryTime - (Date.now() - startTime);
      const nextDelay = Math.min(retryDelay, remainingTime);

      if (nextDelay <= 0) {
        console.error("Retry time budget exceeded");
        throw lastError;
      }

      console.log(`Waiting ${nextDelay / 1000} seconds before next retry...`);
      await new Promise((resolve) => setTimeout(resolve, nextDelay));
    }
  }

  // This should never be reached due to the throw in the loop,
  // but TypeScript needs this for type safety
  throw lastError || new Error("Unknown error during fetch with retry");
}
