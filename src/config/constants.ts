/**
 * Application constants for query executor
 */

import { getConfiguredApiBaseUrl } from "./config";

export function getApiBaseUrl(): string {
  return getConfiguredApiBaseUrl();
}
export const DEFAULT_POLL_INTERVAL = 2; // seconds
export const HELP_TEXT = `
Narrative I/O Query Executor

USAGE:
  bun query_executor.ts [OPTIONS]

OPTIONS:
  -q, --query TEXT           SQL query to execute (inline)
  -f, --file TEXT            File containing SQL query
  -d, --data-plane-id TEXT   Data plane ID (defaults to env var)
  -l, --limit NUMBER         Row limit for query results
  -h, --help                 Show this help message
  --no-poll                  Don't poll for job completion
  -p, --poll-interval NUM    Polling interval in seconds (default: 2)
  -v, --create-view          Create result as a view instead of a materialized view
  --ld, --list-datasets      List all available datasets
  --dd, --delete-dataset ID  Delete a dataset by ID
  -s, --sample-dataset ID    Fetch and display a sample of data from a dataset
  --columns                  Comma-separated list of columns to include in sample
  -m, --map-dataset ID       Map a dataset to attributes
  -mf, --map-file PATH       JSON file containing attribute mappings
  --log                      Enable logging of queries and results
  --show-log                 Display the query execution log
  --rollback TIMESTAMP       Rollback to a specific timestamp (or 'interactive')
  --output-dataset-id, -oid  Output dataset ID in a format that can be captured by scripts
  
  # Direct Snowflake Connection
  -sf, --snowflake           Use direct Snowflake connection
  --snowflake-config JSON    Snowflake configuration as JSON
  --binds JSON               Bind parameters for Snowflake query

  --api-base-url URL         API base URL (defaults to env var or https://app.narrative.io/openapi)
  --verbose                  Enable verbose logging (API requests, request bodies, etc.)

ENVIRONMENT VARIABLES:
  NIO_API_TOKEN              API token for Narrative I/O
  NIO_DATA_PLANE_ID          Default data plane ID
  NIO_API_BASE_URL           API base URL (optional)
  NIO_DEFAULT_EXECUTION_CLUSTER  Default execution cluster: "dedicated" or "shared" (optional)
  
  # Snowflake Connection (when using --snowflake)
  SNOWFLAKE_ACCOUNT          Snowflake account identifier
  SNOWFLAKE_USERNAME         Snowflake username
  SNOWFLAKE_PASSWORD         Snowflake password
  SNOWFLAKE_ROLE             (Optional) Snowflake role
  SNOWFLAKE_WAREHOUSE        (Optional) Snowflake warehouse
  SNOWFLAKE_DATABASE         (Optional) Snowflake database
  SNOWFLAKE_SCHEMA           (Optional) Snowflake schema
  SNOWFLAKE_PRIVATE_KEY      (Optional) Snowflake private key for key pair auth
  SNOWFLAKE_PRIVATE_KEY_PATH (Optional) Path to private key file
  SNOWFLAKE_PRIVATE_KEY_PASS (Optional) Passphrase for private key
`;
