/**
 * Configuration management for the application
 */

import { getApiBaseUrl } from "./environment";

/**
 * Global configuration state
 */
const config = {
  apiBaseUrl: "https://app.narrative.io/openapi",
  verbose: false,
};

/**
 * Initialize configuration with command line arguments
 */
export function initializeConfig(options: { apiBaseUrl?: string; verbose?: boolean } = {}): void {
  config.apiBaseUrl = getApiBaseUrl(options.apiBaseUrl);
  config.verbose = options.verbose || false;
}

/**
 * Get the current API base URL
 */
export function getConfiguredApiBaseUrl(): string {
  return config.apiBaseUrl;
}

/**
 * Get the current verbose setting
 */
export function isVerbose(): boolean {
  return config.verbose;
}
