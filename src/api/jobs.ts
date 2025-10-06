/**
 * API client for job operations
 */

import type { Job } from "@narrative.io/data-collaboration-sdk-ts";
import { isVerbose } from "../config/config";
import { getApiBaseUrl } from "../config/constants";
import { getApiToken } from "../config/environment";
import { fetchWithRetry } from "../utils/http";

/**
 * Poll for job completion
 */
export async function pollForJobCompletion(
  jobId: string,
  datasetId: number,
  pollInterval = 2,
): Promise<Job> {
  const apiToken = getApiToken();

  console.log(`🔍 Polling for job ${jobId} completion...`);
  const startTime = new Date();
  let dots = 0;
  const maxDots = 3;

  while (true) {
    try {
      const apiUrl = `${getApiBaseUrl()}/jobs?dataset_id=${datasetId}`;
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
        console.error(`❌ Error polling job: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(errorText);
        throw new Error(`Error polling job: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const jobs = Array.isArray(data) ? data : ((data.records || []) as Job[]);
      const job = jobs.find((j) => j.job_id === jobId);

      if (!job) {
        console.error(`❓ Job ${jobId} not found in response`);
        throw new Error(`Job ${jobId} not found in response`);
      }

      const elapsedTime = Math.round(
        (new Date().getTime() - new Date(job.created_at).getTime()) / 1000,
      );
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;
      const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

      // Update dots for spinning effect
      dots = (dots + 1) % (maxDots + 1);
      const dotsString = ".".repeat(dots) + " ".repeat(maxDots - dots);

      const spinEmojis = [
        "🕛",
        "🕐",
        "🕑",
        "🕒",
        "🕓",
        "🕔",
        "🕕",
        "🕖",
        "🕗",
        "🕘",
        "🕙",
        "🕚",
        "💫",
      ];
      const spinIndex = Math.floor(Date.now() / 500) % spinEmojis.length;

      // Display progress with emoji based on state
      let stateEmoji = "⏳";
      if (job.state === "running") stateEmoji = spinEmojis[spinIndex];
      else if (job.state === "completed") stateEmoji = "✅";
      else if (job.state === "failed") stateEmoji = "❌";

      process.stdout.write(
        `\r${stateEmoji} Job state: ${job.state}${dotsString} | Elapsed: ${timeDisplay}`,
      );

      if (job.state === "completed") {
        process.stdout.write("\n");
        const totalTime = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
        const totalMinutes = Math.floor(totalTime / 60);
        const totalSeconds = totalTime % 60;
        const totalTimeDisplay =
          totalMinutes > 0 ? `${totalMinutes}m ${totalSeconds}s` : `${totalSeconds}s`;

        console.log(`✅ Job completed successfully in ${totalTimeDisplay}!`);
        console.log(`📊 Dataset ID: ${datasetId} is ready for use`);
        return job;
      }

      if (job.state === "failed") {
        process.stdout.write("\n");
        console.error("❌ Job failed!");

        // The Job type doesn't directly have a "failures" property
        // Let's use a type assertion to access potential error information
        const jobWithErrors = job as unknown as {
          failures?: Array<{ message: string; value?: string }>;
        };

        if (jobWithErrors.failures && jobWithErrors.failures.length > 0) {
          console.error("📝 Failure details:", jobWithErrors.failures);
        }

        // Create a bug report for the failed job
        try {
          const { createJobFailureBugReport } = await import("../utils/logger");

          // Get query and data plane ID from the job object if available
          const query = job.input?.nql || "Query not available";
          const dataPlaneId = job.data_plane_id || "Data plane ID not available";

          const bugReportPath = createJobFailureBugReport(job, query, dataPlaneId);

          if (bugReportPath) {
            console.error(`📋 Bug report created: ${bugReportPath}`);
          }
        } catch (error) {
          console.error(
            `❌ Error creating bug report: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          );
        }

        throw new Error("Job execution failed");
      }

      // Wait for the specified interval
      await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
    } catch (error) {
      // If it's a network or 502 error, the fetchWithRetry should handle retry
      // Other errors will be propagated up
      if (!(error instanceof Error && error.message.includes("502"))) {
        throw error;
      }
      console.error(
        `Error during job polling: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Wait before trying again
      await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
    }
  }
}
