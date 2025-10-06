/**
 * Dataset service for managing datasets
 */

import { deleteDataset, fetchDatasetSample, fetchDatasets } from "../api/datasets";
import { displayTable } from "../utils/table";
const { MultiSelect, Select } = require("enquirer");

/**
 * List all datasets, optionally filtered by data plane ID
 * @param dataPlaneId Optional data plane ID to filter datasets
 */
export async function listDatasets(dataPlaneId?: string): Promise<void> {
  console.log("Fetching datasets...");
  const datasets = await fetchDatasets(dataPlaneId);

  if (datasets.length === 0) {
    console.log("No datasets found.");
    return;
  }

  // Determine maximum width for each column for proper alignment
  let maxIdLength = 2; // "ID"
  let maxNameLength = 4; // "Name"

  for (const dataset of datasets) {
    const id = dataset.id.toString();
    const name = dataset.display_name || "Unnamed";

    maxIdLength = Math.max(maxIdLength, id.length);
    maxNameLength = Math.max(maxNameLength, name.length);
  }

  // Add some padding
  maxIdLength += 2;
  maxNameLength += 2;

  // Format header with proper spacing
  const header = ["ID".padEnd(maxIdLength), "NAME".padEnd(maxNameLength), "CREATED AT"].join(" | ");

  const separator = ["-".repeat(maxIdLength), "-".repeat(maxNameLength), "-".repeat(10)].join(
    "-|-",
  );

  console.log("\n📊 Available Datasets\n");
  console.log(header);
  console.log(separator);

  // Sort datasets by creation date (newest first)
  const sortedDatasets = [...datasets].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  for (const dataset of sortedDatasets) {
    const id = dataset.id.toString().padEnd(maxIdLength);
    const name = (dataset.display_name || "Unnamed").padEnd(maxNameLength);
    const createdAt = new Date(dataset.created_at).toLocaleDateString();

    console.log(`${id} | ${name} | ${createdAt}`);
  }

  console.log(`\n💡 Found ${datasets.length} datasets total.`);

  if (dataPlaneId) {
    console.log(`💡 Showing datasets for data plane ID: ${dataPlaneId}`);
  } else if (process.env.NIO_DATA_PLANE_ID) {
    console.log(`💡 Showing datasets for data plane ID: ${process.env.NIO_DATA_PLANE_ID}`);
  } else {
    console.log("💡 Showing all datasets (no data plane filter)");
  }

  console.log("💡 To delete a dataset, use: bun query_executor.ts --delete-dataset <ID>");
  console.log(
    "💡 For interactive deletion, use: bun query_executor.ts --delete-dataset interactive",
  );
}

/**
 * Delete a dataset by ID
 */
export async function deleteDatasetById(datasetId: string): Promise<void> {
  // Confirm dataset exists first
  const datasets = await fetchDatasets();
  const datasetToDelete = datasets.find((d) => d.id.toString() === datasetId);

  if (!datasetToDelete) {
    console.error(`Error: Dataset with ID ${datasetId} not found`);
    process.exit(1);
  }

  // Ask for confirmation
  console.log("\nYou are about to delete the following dataset:");
  console.log(`ID: ${datasetToDelete.id}`);
  console.log(`Name: ${datasetToDelete.name || "Unnamed"}`);
  console.log(`Status: ${datasetToDelete.status || "Unknown"}`);

  console.log("\nAre you sure you want to delete this dataset? This action cannot be undone.");
  console.log("Type 'yes' to confirm deletion:");

  const confirmation = await new Promise<string>((resolve) => {
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (data) => {
      resolve(data.toString().trim());
      process.stdin.pause();
    });
  });

  if (confirmation.toLowerCase() !== "yes") {
    console.log("Deletion cancelled.");
    process.exit(0);
  }

  // Proceed with deletion
  try {
    console.log(`Deleting dataset ${datasetId}...`);
    const success = await deleteDataset(Number.parseInt(datasetId, 10));

    if (success) {
      console.log(
        `✅ Dataset ${datasetId} (${datasetToDelete.name || "Unnamed"}) deleted successfully!`,
      );
    } else {
      console.error(`Error deleting dataset ${datasetId}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(
      `Error deleting dataset: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    process.exit(1);
  }
}

/**
 * Delete multiple datasets interactively
 */
export async function deleteMultipleDatasets(): Promise<void> {
  // First, fetch and display all datasets
  console.log("Fetching datasets...");
  const datasets = await fetchDatasets();

  if (datasets.length === 0) {
    console.log("No datasets found.");
    return;
  }

  // Calculate column widths for consistent formatting
  let maxIdLength = 5; // "ID" + padding
  let maxNameLength = 20; // Minimum name width

  // Find the maximum length for each column
  for (const dataset of datasets) {
    const id = dataset.id.toString();
    const name = dataset.name || dataset.display_name || "Unnamed";

    maxIdLength = Math.max(maxIdLength, id.length + 2); // Add padding
    maxNameLength = Math.max(maxNameLength, name.length + 2); // Add padding
  }

  // Cap name length to avoid extremely wide displays
  maxNameLength = Math.min(maxNameLength, 40);

  // Sort datasets by creation date (newest first)
  const sortedDatasets = [...datasets].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  console.log("\n📊 Available Datasets");
  console.log(`Found ${datasets.length} datasets total`);

  // Get selection from user using MultiSelect
  const prompt = new MultiSelect({
    name: "datasets",
    message: "Select datasets to delete",
    hint: "Use arrow keys to navigate, space to select, enter to confirm",
    pointer: "▶",
    symbols: { indicator: "✓" },
    choices: sortedDatasets.map((dataset, index) => {
      const id = `${dataset.id}`.padEnd(maxIdLength);
      const rawName = dataset.name || dataset.display_name || "Unnamed";
      // Truncate name if it's too long
      const displayName =
        rawName.length > maxNameLength - 3
          ? `${rawName.substring(0, maxNameLength - 3)}...`
          : rawName;
      const name = displayName.padEnd(maxNameLength);
      const date = new Date(dataset.created_at).toLocaleDateString();

      return {
        name: `${id} | ${name} | ${date} `,
        value: index,
      };
    }),
    result(names: string[]) {
      return this.map(names);
    },
  });

  let selectedIndices: number[] = [];
  try {
    selectedIndices = Object.values(await prompt.run());
  } catch (error) {
    console.log("\nOperation cancelled.");
    return;
  }

  if (selectedIndices.length === 0) {
    console.log("No datasets selected. Operation cancelled.");
    return;
  }

  const selectedDatasets = selectedIndices.map((i) => sortedDatasets[i]);

  // Show confirmation with selected datasets
  console.log("\n🗑️  You are about to delete the following datasets:");
  console.log("────────────────────────────────────────────────────");
  for (const dataset of selectedDatasets) {
    const name = dataset.name || dataset.display_name || "Unnamed";
    console.log(`  • ID: ${dataset.id} | ${name}`);
  }
  console.log("────────────────────────────────────────────────────");

  console.log("\n⚠️  This action cannot be undone! ⚠️");
  console.log("Type 'yes' to confirm deletion:");

  const confirmation = await new Promise<string>((resolve) => {
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (data) => {
      resolve(data.toString().trim());
      process.stdin.pause();
    });
  });

  if (confirmation.toLowerCase() !== "yes") {
    console.log("Deletion cancelled.");
    return;
  }

  // Delete each selected dataset
  console.log("\nDeleting selected datasets...");

  const results = await Promise.all(
    selectedDatasets.map(async (dataset) => {
      try {
        const success = await deleteDataset(dataset.id);

        return {
          id: dataset.id,
          name: dataset.display_name || "Unnamed",
          success,
        };
      } catch (error) {
        return {
          id: dataset.id,
          name: dataset.name || "Unnamed",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
  );

  // Display results
  console.log("\n📋 Deletion Results:");
  console.log("────────────────────────────────────────────────────");
  let successCount = 0;
  for (const result of results) {
    if (result.success) {
      console.log(`  ✅ Dataset ${result.id} | ${result.name} | deleted successfully`);
      successCount++;
    } else {
      console.log(
        `  ❌ Dataset ${result.id} | ${result.name} | failed: ${result.error || "Unknown error"}`,
      );
    }
  }
  console.log("────────────────────────────────────────────────────");

  console.log(`\n🎯 ${successCount} of ${results.length} datasets deleted successfully.`);
}

/**
 * Fetch and display a sample of data from a dataset
 */
export async function fetchAndDisplayDatasetSample(
  datasetId: string,
  options: {
    limit?: number;
    columns?: string[];
  } = {},
): Promise<void> {
  try {
    // Fetch the sample data
    const sampleData = await fetchDatasetSample(Number.parseInt(datasetId, 10));

    if (!sampleData || !sampleData.records || sampleData.records.length === 0) {
      console.log("No sample data available for this dataset.");
      return;
    }

    // Display the data in a table format
    displayTable(sampleData, {
      maxRows: options.limit ?? 10,
      columns: options.columns,
      title: `Dataset Sample for ID: ${datasetId}`,
    });
  } catch (error) {
    console.error(
      `Error fetching dataset sample: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    process.exit(1);
  }
}
