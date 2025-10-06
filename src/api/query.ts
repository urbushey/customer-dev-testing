/**
 * API client for query operations
 */

import type { NqlResult } from "@narrative.io/data-collaboration-sdk-ts";
import { isVerbose } from "../config/config";
import { getApiBaseUrl } from "../config/constants";
import { getApiToken } from "../config/environment";
import { fetchAndDisplayDatasetSample } from "../services/dataset-service";
import type { NIOQueryOptions } from "../types/api";
import type { LogEntry } from "../types/log";
import { fetchWithRetry } from "../utils/http";
import { appendLogEntry } from "../utils/logger";
import { extractViewName, isCreateOrReplace } from "../utils/sql";
import {
  deleteDataset,
  fetchDataset,
  fetchDatasetSample,
  fetchDatasets,
  requestDatasetSample,
} from "./datasets";
import { pollForJobCompletion } from "./jobs";

/**
 * Execute a query against the NIO API
 */
export async function executeNIOQuery(
  options: NIOQueryOptions,
  commitHash?: string,
  enableLogging = false,
): Promise<boolean> {
  const apiToken = getApiToken();

  let nql = options.nql;
  const [replace, normalizedQuery] = isCreateOrReplace(nql);
  nql = normalizedQuery;

  if (replace) {
    const name = extractViewName(normalizedQuery);
    const datasets = await fetchDatasets();

    // Try to find the dataset by name or display_name
    const existingDataset = datasets.find(
      (ds) =>
        ds.name === name ||
        ds.display_name === name ||
        // Also check without quotes and with different casing
        ds.name === name.replace(/"/g, "") ||
        ds.display_name === name.replace(/"/g, ""),
    );

    if (existingDataset) {
      console.log(
        `🗑️ Dataset ${
          existingDataset.name || existingDataset.display_name
        } already exists, deleting...`,
      );
      await deleteDataset(existingDataset.id);
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }
  }

  // Check if query starts with CREATE MATERIALIZED VIEW, if not, add it
  if (!nql.trim().toUpperCase().startsWith("CREATE MATERIALIZED VIEW")) {
    // Fetch existing datasets to avoid name collisions
    const datasetsApiUrl = `${getApiBaseUrl()}/datasets`;
    if (isVerbose()) {
      console.log(`🌐 Making API request to: ${datasetsApiUrl}`);
    }
    const datasetsResponse = await fetchWithRetry(datasetsApiUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiToken}`,
        "content-type": "application/json",
      },
      retryOn: [502],
    });

    if (!datasetsResponse.ok) {
      console.error(
        `Error fetching datasets: ${datasetsResponse.status} ${datasetsResponse.statusText}`,
      );

      if (enableLogging) {
        const logEntry: LogEntry = {
          timestamp: new Date().toISOString(),
          query: nql,
          dataPlaneId: options.data_plane_id,
          status: "error",
          errorMessage: `Failed to fetch datasets: ${datasetsResponse.status} ${datasetsResponse.statusText}`,
          commitHash,
        };
        appendLogEntry(logEntry);
      }

      return false;
    }

    const datasets = await datasetsResponse.json();
    const existingNames = new Set(
      datasets.records.map((ds: { displayName: string }) => ds.displayName),
    );

    // Extract keywords from query for more descriptive naming
    const queryText = nql.trim().toUpperCase();
    const keywords = [];

    // Extract table names from the query to make the name more descriptive
    if (queryText.includes("FROM")) {
      const fromParts = queryText
        .split(/\bFROM\b/i)[1]
        ?.split(/\bWHERE\b|\bGROUP BY\b|\bORDER BY\b|\bLIMIT\b/i)[0]
        ?.trim();
      if (fromParts) {
        // Get the main table name, stripping aliases and schema prefixes
        const mainTable = fromParts.split(/\s+/)[0].split(".").pop()?.replace(/[",]/g, "");
        if (mainTable) keywords.push(mainTable.toLowerCase());
      }
    }

    // Extract main operation type
    if (queryText.startsWith("SELECT")) keywords.push("select");
    else if (queryText.startsWith("WITH")) keywords.push("cte");

    // Create a more descriptive base name
    const baseNameParts = keywords.length > 0 ? keywords : ["query"];
    const randomId = Math.random().toString(36).substring(2, 8);
    let viewName = `${baseNameParts.join("_")}_${randomId}_${Date.now()}`;

    // Ensure name doesn't exceed reasonable length
    if (viewName.length > 50) {
      viewName = `${baseNameParts[0]}_${randomId}_${Date.now()}`;
    }

    // Ensure name is unique
    let counter = 1;
    let finalViewName = viewName;
    while (existingNames.has(finalViewName)) {
      finalViewName = `${viewName}_${counter}`;
      counter++;
    }

    console.log(`Adding CREATE MATERIALIZED VIEW with name: ${finalViewName}`);
    nql = `CREATE MATERIALIZED VIEW ${finalViewName} AS ${nql}`;
  }

  // Apply row limit if specified
  if (options.limit) {
    // Ensure the query ends with LIMIT clause
    if (!nql.toUpperCase().includes("LIMIT")) {
      nql = `${nql} LIMIT ${options.limit} ROWS`;
    }
  }

  console.log("🚀 Executing query...");
  const requestBody: {
    nql: string;
    data_plane_id: string;
    create_as_view?: boolean;
    execution_cluster?: { type: "dedicated" | "shared" };
  } = {
    nql,
    data_plane_id: options.data_plane_id,
  };

  // Add create_as_view if specified
  if (options.create_as_view) {
    requestBody.create_as_view = true;
    console.log("Creating as view: true");
  }

  // Add execution_cluster if specified
  if (options.execution_cluster) {
    requestBody.execution_cluster = options.execution_cluster;
    console.log(`🔧 Using execution cluster: ${JSON.stringify(options.execution_cluster)}`);
  }

  // Log the complete request body for debugging
  if (isVerbose()) {
    console.log("📤 API Request Body:", JSON.stringify(requestBody, null, 2));
  }

  const nqlApiUrl = `${getApiBaseUrl()}/nql/run`;
  if (isVerbose()) {
    console.log(`🌐 Making API request to: ${nqlApiUrl}`);
  }
  const response = await fetchWithRetry(nqlApiUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(requestBody),
    retryOn: [502],
  });

  if (!response.ok) {
    console.error(`Error: ${response.status} ${response.statusText}`);
    const errorText = await response.text();
    console.error(errorText);

    if (enableLogging) {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        query: nql,
        dataPlaneId: options.data_plane_id,
        status: "error",
        errorMessage: `${response.status} ${response.statusText}: ${errorText}`,
        commitHash,
      };
      appendLogEntry(logEntry);
    }

    return false;
  }

  const initialResponse = (await response.json()) as NqlResult;
  const jobId = initialResponse.id;
  const datasetId = initialResponse.input.dataset.id;

  if (!jobId || !datasetId) {
    console.error("Job ID or dataset ID is missing");
    return false;
  }

  console.log(`✅ Job submitted with ID: ${jobId}`);
  console.log(`📁 Dataset ID: ${datasetId}`);

  // Output dataset_id in a format that can be easily parsed by shell scripts
  if (options.output_dataset_id) {
    console.log(`DATASET_ID=${datasetId}`);
  }

  if (options.poll === false) {
    console.log("Initial response:");
    console.log(JSON.stringify(initialResponse, null, 2));

    if (enableLogging) {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        query: nql,
        dataPlaneId: options.data_plane_id,
        status: "success",
        datasetId,
        commitHash,
      };
      appendLogEntry(logEntry);
    }

    return true;
  }

  // Poll for job completion
  const pollInterval = options.poll_interval || 2;
  let completedJob;
  try {
    completedJob = await pollForJobCompletion(jobId, datasetId, pollInterval);
  } catch (error) {
    // If the job failed during polling, create a detailed bug report
    if (error instanceof Error && error.message === "Job execution failed") {
      try {
        // Import the createJobFailureBugReport function
        const { createJobFailureBugReport } = await import("../utils/logger");

        // We need to get the job details again to create the bug report
        const apiToken = getApiToken();
        const jobsApiUrl = `${getApiBaseUrl()}/jobs?dataset_id=${datasetId}`;
        if (isVerbose()) {
          console.log(`🌐 Making API request to: ${jobsApiUrl}`);
        }
        const response = await fetchWithRetry(jobsApiUrl, {
          method: "GET",
          headers: {
            accept: "application/json",
            authorization: `Bearer ${apiToken}`,
            "content-type": "application/json",
          },
          retryOn: [502],
        });

        if (response.ok) {
          const data = await response.json();
          const jobs = Array.isArray(data) ? data : ((data.records || []) as { job_id: string }[]);
          const job = jobs.find((j) => j.job_id === jobId);

          if (job) {
            // Create a detailed bug report with all available information
            const additionalInfo = {
              options,
              initialResponse,
              commitHash,
            };

            createJobFailureBugReport(
              job,
              nql,
              options.data_plane_id,
              options.company_id,
              additionalInfo,
            );
          }
        }
      } catch (bugReportError) {
        console.error(
          `❌ Error creating detailed bug report: ${
            bugReportError instanceof Error ? bugReportError.message : "Unknown error"
          }`,
        );
      }
    }
    throw error; // Re-throw the original error
  }

  if (completedJob.state === "failed") {
    console.error(`Job failed: ${JSON.stringify(completedJob, null, 2)}`);

    // Create a detailed bug report with all available information
    try {
      const { createJobFailureBugReport } = await import("../utils/logger");
      const additionalInfo = {
        options,
        initialResponse,
        commitHash,
      };

      createJobFailureBugReport(
        completedJob,
        nql,
        options.data_plane_id,
        options.company_id,
        additionalInfo,
      );
    } catch (error) {
      console.error(
        `❌ Error creating bug report: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return false;
  }

  // If the job completed but has no result data yet, we can try to fetch the dataset
  if (completedJob.state === "completed") {
    console.log("\n🔍 Fetching dataset metadata...");
    try {
      console.log(`🔍 Fetching dataset with ID: ${datasetId}`);
      const datasetData = await fetchDataset(datasetId);

      console.log("\n📊 Dataset Summary");
      console.log(`\n💡 To query this dataset directly, use dataset: ${datasetData.name}`);

      // Request sample data from the dataset
      console.log("\n🔍 Requesting sample data from dataset...");
      try {
        await requestDatasetSample(datasetId);
        console.log("📊 Sample data requested successfully");
        console.log("✨ Sample data will be available soon");

        // Poll for the sample data to be available up to 60 seconds
        // pause 3 seconds between polls
        for (let i = 0; i < 20; i++) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const sampleData = await fetchDatasetSample(datasetId);
          if (sampleData.records.length > 0) {
            // print 10 records of the sample data in a table format
            await fetchAndDisplayDatasetSample(datasetId, { limit: 10 });
            break;
          }
        }
      } catch (sampleError) {
        console.error(
          `⚠️ Error requesting sample data: ${
            sampleError instanceof Error ? sampleError.message : "Unknown error"
          }`,
        );
      }

      if (enableLogging === true) {
        console.log("🔍 Creating log entry with enableLogging=true");
        try {
          const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            query: nql,
            dataPlaneId: options.data_plane_id,
            status: "success",
            datasetId,
            datasetName: datasetData.display_name || extractViewName(nql),
            commitHash,
          };

          // Also try the regular logging method
          appendLogEntry(logEntry);
        } catch (logError) {
          console.error(
            `❌ Error creating log entry: ${
              logError instanceof Error ? logError.message : "Unknown error"
            }`,
          );
        }
      } else {
        console.log("⚠️ Logging is disabled (enableLogging=false)");
      }

      console.log("\n✅ Query execution completed successfully");

      // Output dataset_id again after completion for easier capture in scripts
      if (options.output_dataset_id) {
        console.log(`DATASET_ID=${datasetId}`);
      }

      return true;
    } catch (error) {
      console.error(
        `⚠️ Error fetching dataset data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );

      if (enableLogging === true) {
        console.log("🔍 Creating log entry for error case with enableLogging=true");
        try {
          const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            query: nql,
            dataPlaneId: options.data_plane_id,
            status: "success",
            datasetId,
            datasetName: extractViewName(nql),
            commitHash,
          };
          appendLogEntry(logEntry);
        } catch (logError) {
          console.error(
            `❌ Error creating log entry in error case: ${
              logError instanceof Error ? logError.message : "Unknown error"
            }`,
          );
        }
      } else {
        console.log("⚠️ Logging is disabled in error case (enableLogging=false)");
      }

      return true; // Still return true since query executed successfully
    }
  }

  return true;
}
