/**
 * API client for dataset operations
 */

import type { ApiRecords, Dataset } from "@narrative.io/data-collaboration-sdk-ts";
import { isVerbose } from "../config/config";
import { getApiBaseUrl } from "../config/constants";
import { getApiToken } from "../config/environment";
import { fetchWithRetry } from "../utils/http";

/**
 * Fetch all datasets from the API, optionally filtered by data plane ID
 * @param dataPlaneId Optional data plane ID to filter datasets
 */
export async function fetchDatasets(dataPlaneId?: string): Promise<Dataset[]> {
  const apiToken = getApiToken();

  // Use environment variable as fallback if not provided as parameter
  const filteredDataPlaneId = dataPlaneId || process.env.NIO_DATA_PLANE_ID;

  try {
    const apiUrl = `${getApiBaseUrl()}/datasets`;
    if (isVerbose()) {
      console.log(`🌐 Making API request to: ${apiUrl}`);
    }
    const response = await fetchWithRetry(apiUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiToken}`,
        "content-type": "application/json",
      },
      retryOn: [502], // Retry on 502 errors
    });

    if (!response.ok) {
      console.error(`Error fetching datasets: ${response.status} ${response.statusText}`);
      throw new Error(`Error fetching datasets: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let datasets = data.records || [];

    // Filter by data plane ID if provided
    if (filteredDataPlaneId) {
      datasets = datasets.filter(
        (dataset: Dataset) =>
          dataset.data_plane.id === Number(filteredDataPlaneId) ||
          dataset.data_plane.id === filteredDataPlaneId,
      );
    }

    return datasets;
  } catch (error) {
    console.error(
      `Error fetching datasets: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
}

/**
 * Fetch a single dataset by ID
 */
export async function fetchDataset(datasetId: number): Promise<Dataset> {
  const apiToken = getApiToken();
  console.log(`🔍 In fetchDataset for ID: ${datasetId}`);

  try {
    const apiUrl = `${getApiBaseUrl()}/datasets/${datasetId}`;
    if (isVerbose()) {
      console.log(`🌐 Making API request to: ${apiUrl}`);
    }
    const response = await fetchWithRetry(apiUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiToken}`,
        "content-type": "application/json",
      },
      retryOn: [502],
    });

    if (!response.ok) {
      console.error(`Error fetching dataset: ${response.status} ${response.statusText}`);
      throw new Error(`Error fetching dataset: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📄 Dataset response raw: ${JSON.stringify(data).substring(0, 200)}...`);

    // Write directly to the log file for debugging
    const fs = require("node:fs");
    const path = require("node:path");
    const debugFile = path.join(process.cwd(), "logs", "debug.json");
    fs.writeFileSync(debugFile, JSON.stringify(data, null, 2));
    console.log(`💾 Wrote debug data to ${debugFile}`);

    return data;
  } catch (error) {
    console.error(
      `Error fetching dataset: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
}

/**
 * Delete a dataset by ID
 */
export async function deleteDataset(datasetId: number): Promise<boolean> {
  const apiToken = getApiToken();

  try {
    const apiUrl = `${getApiBaseUrl()}/datasets/${datasetId}`;
    if (isVerbose()) {
      console.log(`🌐 Making API request to: ${apiUrl}`);
    }
    const response = await fetchWithRetry(apiUrl, {
      method: "DELETE",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiToken}`,
      },
      retryOn: [502],
    });

    if (!response.ok) {
      console.error(`Error deleting dataset: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      `Error deleting dataset: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return false;
  }
}

/**
 * Request a sample of data from a dataset
 */
export async function requestDatasetSample(datasetId: number): Promise<void> {
  const apiToken = getApiToken();
  console.log(`🔍 Requesting sample data for dataset ID: ${datasetId}`);

  try {
    const apiUrl = `${getApiBaseUrl()}/datasets/${datasetId}/request-sample`;
    if (isVerbose()) {
      console.log(`🌐 Making API request to: ${apiUrl}`);
    }
    const response = await fetchWithRetry(apiUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiToken}`,
        "content-type": "application/json",
      },
      retryOn: [502],
    });

    if (!response.ok) {
      console.error(`Error requesting dataset sample: ${response.status} ${response.statusText}`);
      throw new Error(`Error requesting dataset sample: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("📄 Dataset sample requested successfully");

    return data;
  } catch (error) {
    console.error(
      `Error requesting dataset sample: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
    throw error;
  }
}

/**
 * Fetch a sample of data from a dataset
 */
export async function fetchDatasetSample(
  datasetId: number,
): Promise<ApiRecords<Record<string, string>>> {
  const apiToken = getApiToken();

  try {
    const apiUrl = `${getApiBaseUrl()}/datasets/${datasetId}/sample`;
    if (isVerbose()) {
      console.log(`🌐 Making API request to: ${apiUrl}`);
    }
    const response = await fetchWithRetry(apiUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiToken}`,
        "content-type": "application/json",
      },
      retryOn: [502],
    });

    if (!response.ok) {
      console.error(`Error fetching dataset sample: ${response.status} ${response.statusText}`);
      throw new Error(`Error fetching dataset sample: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error(
      `Error fetching dataset sample: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
}
