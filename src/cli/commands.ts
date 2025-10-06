/**
 * Command handlers for CLI
 */

import { HELP_TEXT } from "../config/constants";
import {
  deleteDatasetById,
  deleteMultipleDatasets,
  fetchAndDisplayDatasetSample,
  listDatasets,
} from "../services/dataset-service";
import { showQueryLog } from "../services/logging-service";
import { executeQuery } from "../services/query-service";
import { interactiveRollback, performRollback } from "../services/rollback-service";
import { SnowflakeService } from "../services/snowflake-service";
import type { CommandLineArgs } from "../types/cli";
import { ensureNotOnMainBranch } from "../utils/git";
import { ensureLogDirectory } from "../utils/logger";

/**
 * Process help command
 */
export function handleHelpCommand(): void {
  console.log(HELP_TEXT);
  process.exit(0);
}

/**
 * Process list datasets command
 */
export async function handleListDatasetsCommand(
  parsedArgs?: Partial<CommandLineArgs>,
): Promise<void> {
  const dataPlaneId = parsedArgs?.["--data-plane-id"];
  await listDatasets(dataPlaneId);
}

/**
 * Process delete dataset command
 */
export async function handleDeleteDatasetCommand(datasetId: string): Promise<void> {
  if (datasetId.toLowerCase() === "interactive") {
    await deleteMultipleDatasets();
  } else {
    await deleteDatasetById(datasetId);
  }
}

/**
 * Process query execution command
 */
export async function handleQueryCommand(parsedArgs: Partial<CommandLineArgs>): Promise<void> {
  // Check if we're on main branch and create adhoc branch if needed
  const branchInfo = ensureNotOnMainBranch();

  // Ensure log directory exists if logging is enabled
  if (parsedArgs["--log"]) {
    ensureLogDirectory();
  }

  const success = await executeQuery({
    query: parsedArgs["--query"],
    filePath: parsedArgs["--file"],
    dataPlaneId: parsedArgs["--data-plane-id"],
    limit: parsedArgs["--limit"] ? Number.parseInt(parsedArgs["--limit"], 10) : undefined,
    noPoll: parsedArgs["--no-poll"],
    pollInterval: parsedArgs["--poll-interval"]
      ? Number.parseInt(parsedArgs["--poll-interval"], 10)
      : undefined,
    enableLogging: parsedArgs["--log"] === true,
    createView: parsedArgs["--create-view"] === true,
    outputDatasetId: parsedArgs["--output-dataset-id"] === true,
  });

  if (!success) {
    process.exit(1);
  }
}

/**
 * Process show log command
 */
export async function handleShowLogCommand(): Promise<void> {
  await showQueryLog();
}

/**
 * Process rollback command
 */
export async function handleRollbackCommand(timestamp: string): Promise<void> {
  if (timestamp.toLowerCase() === "interactive") {
    await interactiveRollback();
  } else {
    await performRollback(timestamp);
  }
}

/**
 * Process Snowflake query execution command
 */
export async function handleSnowflakeQueryCommand(
  parsedArgs: Partial<CommandLineArgs>,
): Promise<void> {
  try {
    // Configuration can come from environment variables or command line
    const snowflakeService = parsedArgs["--snowflake-config"]
      ? new SnowflakeService(JSON.parse(parsedArgs["--snowflake-config"] as string))
      : SnowflakeService.fromEnv();

    // Execute the query
    const queryResult = await snowflakeService.executeQuery(
      (parsedArgs["--query"] as string) || "",
      parsedArgs["--binds"] ? JSON.parse(parsedArgs["--binds"] as string) : undefined,
    );

    // Use the table display utility
    const { displayTable } = await import("../utils/table");

    // Process optional columns parameter
    const columns = parsedArgs["--columns"]
      ? (parsedArgs["--columns"] as string).split(",").map((col) => col.trim())
      : undefined;

    // Display results in a table
    displayTable(queryResult.data, {
      maxRows: parsedArgs["--limit"] ? Number.parseInt(parsedArgs["--limit"] as string, 10) : 10,
      columns,
      title: "Snowflake Query Results",
    });
  } catch (error) {
    console.error("Error executing Snowflake query:", error);
    process.exit(1);
  }
}

/**
 * Process dataset sample command
 */
export async function handleSampleDatasetCommand(
  datasetId: string,
  parsedArgs: Partial<CommandLineArgs>,
): Promise<void> {
  try {
    // Process optional columns parameter
    const columns = parsedArgs["--columns"]
      ? (parsedArgs["--columns"] as string).split(",").map((col) => col.trim())
      : undefined;

    // Process optional limit parameter
    const limit = parsedArgs["--limit"]
      ? Number.parseInt(parsedArgs["--limit"] as string, 10)
      : undefined;

    // Fetch and display the sample data
    await fetchAndDisplayDatasetSample(datasetId, { columns, limit });
  } catch (error) {
    console.error("Error fetching dataset sample:", error);
    process.exit(1);
  }
}

/**
 * Process dataset attribute mapping command
 */
export async function handleMapDatasetCommand(
  datasetId: string,
  mappingsFilePath: string,
): Promise<void> {
  try {
    // Import the mapping service
    const { applyDatasetAttributeMappings } = await import("../services/mapping-service");

    // Apply the mappings
    const result = await applyDatasetAttributeMappings(datasetId, mappingsFilePath);

    // Display summary of successful vs failed mappings
    const successCount = result.results.filter((r) => r.success).length;
    const totalCount = result.results.length;

    if (result.success) {
      console.log(
        `✅ Successfully applied all ${totalCount} attribute mappings to dataset ${datasetId}!`,
      );
    } else {
      console.error(
        `⚠️ ${successCount} of ${totalCount} attribute mappings succeeded for dataset ${datasetId}. See above for details on failures.`,
      );
      process.exit(1);
    }
  } catch (error) {
    console.error(
      `Error mapping dataset attributes: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
    process.exit(1);
  }
}
