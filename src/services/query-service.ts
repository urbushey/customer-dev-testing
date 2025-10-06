/**
 * Query service for executing SQL queries
 */

import fs from "node:fs";
import { executeNIOQuery } from "../api/query";
import { getDataPlaneId, getDefaultExecutionCluster } from "../config/environment";
import { commitQueryFile } from "../utils/git";
import { stripSqlComments } from "../utils/sql";

/**
 * Execute a SQL query
 */
export async function executeQuery({
  query,
  filePath,
  dataPlaneId: cmdDataPlaneId,
  limit,
  noPoll,
  pollInterval,
  enableLogging,
  createView,
  outputDatasetId,
  executionCluster,
}: {
  query?: string;
  filePath?: string;
  dataPlaneId?: string;
  limit?: number;
  noPoll?: boolean;
  pollInterval?: number;
  enableLogging?: boolean;
  createView?: boolean;
  outputDatasetId?: boolean;
  executionCluster?: string;
}): Promise<boolean> {
  // Get the data plane ID
  const dataPlaneId = getDataPlaneId(cmdDataPlaneId);

  // If file is specified, read query from file
  let sqlQuery = query || "";
  if (filePath) {
    try {
      sqlQuery = fs.readFileSync(filePath, "utf8");
    } catch (error) {
      console.error(
        `Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return false;
    }
  }

  // Ensure we have a query
  if (!sqlQuery) {
    console.error("Error: No query provided");
    return false;
  }

  // Remove comments from the query before sending to API
  sqlQuery = stripSqlComments(sqlQuery);

  // Parse and validate execution cluster - use environment default if no flag provided
  const defaultExecutionCluster = getDefaultExecutionCluster(executionCluster);
  let parsedExecutionCluster;

  if (defaultExecutionCluster) {
    parsedExecutionCluster = { type: defaultExecutionCluster };
    if (!executionCluster && process.env.NIO_DEFAULT_EXECUTION_CLUSTER) {
      console.log(
        `🔧 Using default execution cluster from environment: ${defaultExecutionCluster}`,
      );
    }
  }

  try {
    // Execute the query without committing the file first
    console.log(`🔍 In executeQuery - enableLogging = ${enableLogging}`);

    const success = await executeNIOQuery(
      {
        nql: sqlQuery,
        data_plane_id: dataPlaneId,
        limit,
        poll: !noPoll,
        poll_interval: pollInterval,
        create_as_view: createView,
        output_dataset_id: outputDatasetId,
        execution_cluster: parsedExecutionCluster,
      },
      undefined, // No commit hash yet
      enableLogging === true,
    );

    // If query execution was successful and we have a file path, commit the file
    let commitHash: string | undefined;
    if (success && filePath) {
      commitHash = commitQueryFile(filePath, success);
      console.log("✅ Query executed successfully and changes committed.");
    }

    return success;
  } catch (error) {
    console.error(
      `Query execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return false;
  }
}
