/**
 * Environment variable management for query executor
 */

import { config } from "dotenv";

// Load environment variables from .env file
config();

/**
 * Get an environment variable with error handling
 * @param name The name of the environment variable
 * @throws Error if the environment variable is not set
 */
export function getEnvVar(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable not set`);
  }

  return value;
}

/**
 * Get the API token from environment variables
 * @throws Error if API token is not set
 */
export function getApiToken(): string {
  return getEnvVar("NIO_API_TOKEN");
}

/**
 * Get the data plane ID from environment variables or command line args
 * @param cmdDataPlaneId Optional data plane ID from command line
 * @throws Error if data plane ID is not set
 */
export function getDataPlaneId(cmdDataPlaneId?: string): string {
  const dataPlaneId = cmdDataPlaneId || process.env.NIO_DATA_PLANE_ID;

  if (!dataPlaneId) {
    throw new Error(
      "No data plane ID provided. Use --data-plane-id or set NIO_DATA_PLANE_ID env var",
    );
  }

  return dataPlaneId;
}
/**
 * Get the default execution cluster from environment variables
 * @param cmdExecutionCluster Optional execution cluster from command line
 * @returns The execution cluster type or undefined if not set
 */
export function getDefaultExecutionCluster(
  cmdExecutionCluster?: string,
): "dedicated" | "shared" | undefined {
  const executionCluster = cmdExecutionCluster || process.env.NIO_DEFAULT_EXECUTION_CLUSTER;

  if (executionCluster && executionCluster !== "dedicated" && executionCluster !== "shared") {
    console.warn(
      `Warning: Invalid NIO_DEFAULT_EXECUTION_CLUSTER value "${executionCluster}". Must be "dedicated" or "shared". Ignoring.`,
    );
    return undefined;
  }

  return executionCluster as "dedicated" | "shared" | undefined;
}

/**
 * Get the API base URL from command line args, environment variables, or default
 * @param cmdApiBaseUrl Optional API base URL from command line
 * @returns The API base URL to use
 */
export function getApiBaseUrl(cmdApiBaseUrl?: string): string {
  const apiBaseUrl = cmdApiBaseUrl || process.env.NIO_API_BASE_URL;

  // Return the configured URL if provided, otherwise default
  return apiBaseUrl || "https://app.narrative.io/openapi";
}
