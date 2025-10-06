/**
 * Logging-related types for the query executor
 */

export interface LogEntry {
  timestamp: string;
  query: string;
  dataPlaneId: string;
  status: "success" | "error";
  datasetId?: number;
  datasetName?: string;
  rowCount?: number;
  errorMessage?: string;
  commitHash?: string;
}
