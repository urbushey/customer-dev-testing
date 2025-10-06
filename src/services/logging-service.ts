/**
 * Logging service for the query executor
 */

import { getLogEntries } from "../utils/logger";

/**
 * Display query execution log
 */
export async function showQueryLog(): Promise<void> {
  const entries = getLogEntries();

  if (entries.length === 0) {
    console.log("📝 No query log entries found.");
    return;
  }

  console.log("\n📋 Query Execution Log");
  console.log("════════════════════════════════════════════════════");

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const date = new Date(entry.timestamp).toLocaleString();
    const status = entry.status === "success" ? "✅" : "❌";

    console.log(
      `${i + 1}. [${date}] ${status} Dataset: ${entry.datasetName || "Unnamed"} (ID: ${
        entry.datasetId || "N/A"
      })`,
    );

    // Print truncated query
    const queryPreview =
      entry.query.length > 80 ? `${entry.query.substring(0, 77)}...` : entry.query;
    console.log(`   Query: ${queryPreview}`);

    if (entry.status === "success" && entry.rowCount !== undefined) {
      console.log(`   Rows: ${entry.rowCount.toLocaleString()}`);
    } else if (entry.status === "error" && entry.errorMessage) {
      console.log(`   Error: ${entry.errorMessage}`);
    }

    // Show commit hash if available
    if (entry.commitHash) {
      console.log(`   Commit: ${entry.commitHash}`);
    }

    console.log("────────────────────────────────────────────────────");
  }

  console.log(`\n💡 Found ${entries.length} log entries total.`);
  console.log(
    "💡 To rollback to a specific point, use: bun query_executor.ts --rollback <TIMESTAMP>",
  );
  console.log("💡 For interactive rollback, use: bun query_executor.ts --rollback interactive");
}
