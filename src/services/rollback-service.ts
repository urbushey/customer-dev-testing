/**
 * Rollback service for reverting datasets
 */

import fs from "node:fs";
import { deleteDataset } from "../api/datasets";
import { getLogEntries } from "../utils/logger";
import { QUERY_LOG_FILE } from "../utils/logger";
const { Select } = require("enquirer");

/**
 * Perform rollback to a specific log entry
 */
export async function performRollback(timestamp: string): Promise<void> {
  const entries = getLogEntries();

  if (entries.length === 0) {
    console.log("📝 No query log entries found.");
    return;
  }

  let targetIndex = -1;

  // If timestamp is a number, use it as the index
  if (!Number.isNaN(Number(timestamp))) {
    const index = Number(timestamp) - 1; // Convert to 0-based index
    if (index >= 0 && index < entries.length) {
      targetIndex = index;
    } else {
      console.error(
        `❌ Invalid log entry index: ${timestamp}. Valid range is 1-${entries.length}.`,
      );
      return;
    }
  } else {
    // Find entry matching the timestamp
    targetIndex = entries.findIndex((entry) => entry.timestamp === timestamp);
    if (targetIndex === -1) {
      console.error(`❌ No log entry found with timestamp: ${timestamp}`);
      return;
    }
  }

  // Collect entries after the target index that were successful
  const toDelete = entries
    .slice(targetIndex + 1)
    .filter((entry) => entry.status === "success" && entry.datasetId !== undefined)
    .map((entry) => ({
      id: entry.datasetId,
      name: entry.datasetName || "Unnamed",
    }));

  if (toDelete.length === 0) {
    console.log("No datasets to delete for rollback.");
    return;
  }

  // Show confirmation
  console.log("\n🗑️  The following datasets will be deleted for rollback:");
  console.log("────────────────────────────────────────────────────");
  for (const dataset of toDelete) {
    console.log(`  • ID: ${dataset.id} | ${dataset.name}`);
  }
  console.log("────────────────────────────────────────────────────");

  console.log(`\n⚠️  Rolling back to: ${new Date(entries[targetIndex].timestamp).toLocaleString()}`);
  console.log("⚠️  This action cannot be undone!");
  console.log("Type 'yes' to confirm rollback:");

  const confirmation = await new Promise<string>((resolve) => {
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (data) => {
      resolve(data.toString().trim());
      process.stdin.pause();
    });
  });

  if (confirmation.toLowerCase() !== "yes") {
    console.log("Rollback cancelled.");
    return;
  }

  // Delete each dataset and track results
  console.log("\nPerforming rollback...");

  let successCount = 0;

  for (const dataset of toDelete) {
    try {
      console.log(`Deleting dataset ${dataset.id} (${dataset.name})...`);

      if (await deleteDataset(dataset.id as number)) {
        console.log("  ✅ Success");
        successCount++;
      } else {
        console.error(`  ❌ Failed to delete dataset ${dataset.id}`);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Update the log file if any datasets were successfully deleted
  if (successCount > 0) {
    const newEntries = entries.slice(0, targetIndex + 1);
    try {
      fs.writeFileSync(QUERY_LOG_FILE, JSON.stringify(newEntries, null, 2));
      console.log(
        `\n✅ Log updated to remove ${
          entries.length - newEntries.length
        } entries after rollback point`,
      );
    } catch (error) {
      console.error(
        `Error updating log file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  console.log(`\n🎯 Rollback completed: ${successCount} of ${toDelete.length} datasets deleted.`);
}

/**
 * Interactive rollback with dataset selection
 */
export async function interactiveRollback(): Promise<void> {
  const entries = getLogEntries();

  if (entries.length === 0) {
    console.log("📝 No query log entries found.");
    return;
  }

  // Prepare choices for selection
  const choices = entries.map((entry, index) => {
    const date = new Date(entry.timestamp).toLocaleString();
    const status = entry.status === "success" ? "✅" : "❌";
    const datasetInfo = entry.datasetId
      ? `Dataset: ${entry.datasetName || "Unnamed"} (ID: ${entry.datasetId})`
      : "No dataset created";

    return {
      name: `${index + 1}. [${date}] ${status} ${datasetInfo}`,
      value: index,
    };
  });

  // Create the selection prompt
  const prompt = new Select({
    name: "rollbackPoint",
    message: "Select a point to rollback to:",
    choices,
  });

  let selectedIndex: number;
  try {
    selectedIndex = await prompt.run();
  } catch (error) {
    console.log("\nOperation cancelled.");
    return;
  }

  // Perform the rollback using the selected timestamp
  await performRollback((selectedIndex + 1).toString());
}
