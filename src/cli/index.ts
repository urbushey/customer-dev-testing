#!/usr/bin/env bun
/**
 * Narrative I/O Query Executor
 *
 * CLI tool for executing queries against Narrative I/O API and managing datasets
 */

import { initializeConfig } from "../config/config";
import { parseArgs } from "./args";
import {
  handleDeleteDatasetCommand,
  handleHelpCommand,
  handleListDatasetsCommand,
  handleMapDatasetCommand,
  handleQueryCommand,
  handleRollbackCommand,
  handleSampleDatasetCommand,
  handleShowLogCommand,
  handleSnowflakeQueryCommand,
} from "./commands";

/**
 * Main function to process CLI commands
 */
async function main() {
  // Parse command line arguments
  const rawArgs = Bun.argv.slice(2); // Skip bun and script name
  const parsedArgs = parseArgs(rawArgs);

  // Initialize configuration with CLI arguments
  initializeConfig({
    apiBaseUrl: parsedArgs["--api-base-url"],
    verbose: parsedArgs["--verbose"],
  });

  // Process commands
  if (parsedArgs["--help"]) {
    handleHelpCommand();
    return;
  }

  if (parsedArgs["--show-log"]) {
    await handleShowLogCommand();
    return;
  }

  if (parsedArgs["--rollback"]) {
    const rollbackArg = parsedArgs["--rollback"];
    if (rollbackArg) {
      await handleRollbackCommand(rollbackArg);
      return;
    }
  }

  if (parsedArgs["--list-datasets"]) {
    await handleListDatasetsCommand(parsedArgs);
    return;
  }

  if (parsedArgs["--delete-dataset"]) {
    await handleDeleteDatasetCommand(parsedArgs["--delete-dataset"]);
    return;
  }

  if (parsedArgs["--sample-dataset"]) {
    await handleSampleDatasetCommand(parsedArgs["--sample-dataset"], parsedArgs);
    return;
  }

  // Check if dataset mapping is requested
  if (parsedArgs["--map-dataset"] && parsedArgs["--map-file"]) {
    await handleMapDatasetCommand(parsedArgs["--map-dataset"], parsedArgs["--map-file"]);
    return;
  }

  // Check if Snowflake query is requested
  if (parsedArgs["--snowflake"]) {
    await handleSnowflakeQueryCommand(parsedArgs);
    return;
  }

  // Default to query execution if no specific command is provided
  await handleQueryCommand(parsedArgs);
}

// Run the CLI
main().catch((error) => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
