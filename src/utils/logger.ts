/**
 * Logging utilities for the query executor
 */

import fs from "node:fs";
import path from "node:path";
import type { Job } from "@narrative.io/data-collaboration-sdk-ts";
import type { LogEntry } from "../types/log";

// Simple console logger for use in services
export const logger = {
  info: (message: string, ...args: unknown[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: unknown[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(`[WARN] ${message}`, ...args),
  debug: (message: string, ...args: unknown[]) => console.debug(`[DEBUG] ${message}`, ...args),
};

// Setup logging directory
export const LOG_DIR = path.join(process.cwd(), "logs");
export const QUERY_LOG_FILE = path.join(LOG_DIR, "query_log.jsonl");
export const BUG_REPORTS_DIR = path.join(LOG_DIR, "bug_reports");

/**
 * Ensures the log directory exists
 */
export function ensureLogDirectory(): void {
  console.log(`🔍 Checking if log directory exists at ${LOG_DIR}`);

  if (!fs.existsSync(LOG_DIR)) {
    console.log(`📁 Creating log directory at ${LOG_DIR}`);
    try {
      fs.mkdirSync(LOG_DIR, { recursive: true });
      console.log("✅ Log directory created successfully");
    } catch (error) {
      console.error(
        `❌ Error creating log directory: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  } else {
    console.log("✅ Log directory already exists");
  }

  // Also initialize the log file if it doesn't exist yet
  if (!fs.existsSync(QUERY_LOG_FILE)) {
    console.log(`📄 Creating empty log file at ${QUERY_LOG_FILE}`);
    try {
      fs.writeFileSync(QUERY_LOG_FILE, "");
      console.log("✅ Empty log file created successfully");
    } catch (error) {
      console.error(
        `❌ Error creating log file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

/**
 * Get all log entries from the log file
 */
export function getLogEntries(): LogEntry[] {
  if (!fs.existsSync(QUERY_LOG_FILE)) {
    return [];
  }

  try {
    const logData = fs.readFileSync(QUERY_LOG_FILE, "utf8");
    const entries: LogEntry[] = [];

    // Split by newlines and parse each line as JSON
    const lines = logData.trim().split("\n");
    for (const line of lines) {
      if (line.trim()) {
        entries.push(JSON.parse(line));
      }
    }

    return entries;
  } catch (error) {
    console.error(
      `Error reading log file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return [];
  }
}

/**
 * Append a new log entry to the log file
 */
export function appendLogEntry(entry: LogEntry): void {
  console.log("📝 Adding log entry...");
  console.log(`📁 Writing to log file: ${QUERY_LOG_FILE}`);

  try {
    // Ensure log directory exists
    ensureLogDirectory();

    // Check if log directory was created successfully
    if (!fs.existsSync(LOG_DIR)) {
      console.error(`❌ Failed to create log directory at ${LOG_DIR}`);
      return;
    }

    // Append the new entry as a single line of JSON
    const jsonLine = `${JSON.stringify(entry)}\n`;

    // Write the entry to the log file
    fs.appendFileSync(QUERY_LOG_FILE, jsonLine);

    // Verify the file was written correctly
    if (fs.existsSync(QUERY_LOG_FILE)) {
      const fileSize = fs.statSync(QUERY_LOG_FILE).size;
      console.log(`✅ Log entry written successfully (file size: ${fileSize} bytes)`);
    } else {
      console.error(`❌ Log file does not exist after writing: ${QUERY_LOG_FILE}`);
    }
  } catch (error) {
    console.error(
      `❌ Error writing to log file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Ensures the bug reports directory exists
 */
export function ensureBugReportsDirectory(): void {
  if (!fs.existsSync(BUG_REPORTS_DIR)) {
    console.log(`📁 Creating bug reports directory at ${BUG_REPORTS_DIR}`);
    try {
      fs.mkdirSync(BUG_REPORTS_DIR, { recursive: true });
      console.log("✅ Bug reports directory created successfully");
    } catch (error) {
      console.error(
        `❌ Error creating bug reports directory: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}

/**
 * Creates a bug report when a job fails
 */
export function createJobFailureBugReport(
  job: Job,
  query: string,
  dataPlaneId: string,
  companyId?: string,
  additionalInfo?: Record<string, unknown>,
): string {
  console.log("📝 Creating bug report for failed job...");

  // Ensure bug reports directory exists
  ensureBugReportsDirectory();

  if (!fs.existsSync(BUG_REPORTS_DIR)) {
    console.error(`❌ Failed to create bug reports directory at ${BUG_REPORTS_DIR}`);
    return "";
  }

  const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\./g, "-");
  const filename = `job-failure-${job.job_id}-${timestamp}.md`;
  const filePath = path.join(BUG_REPORTS_DIR, filename);

  const cleanedQuery = query.trim();

  // Generate markdown content for the bug report
  const content = `# Job Failure Bug Report

## Failure Time
${new Date().toISOString()}

## Job Details
- **Job ID**: ${job.job_id}
- **Created At**: ${job.created_at}
- **State**: ${job.state}
- **Data Plane ID**: ${dataPlaneId}
${companyId ? `- **Company ID**: ${companyId}` : ""}

## Failure Details
${(() => {
  // The Job type doesn't directly have a "failures" property
  // Let's use a type assertion to access potential error information
  const jobWithErrors = job as unknown as { failures?: Array<{ message: string; value?: string }> };

  if (jobWithErrors.failures && jobWithErrors.failures.length > 0) {
    return jobWithErrors.failures
      .map((failure, index) => `### Failure ${index + 1}\n${JSON.stringify(failure, null, 2)}`)
      .join("\n\n");
  }

  // Look for other potential error information in the job
  if (job.state === "failed") {
    return `Job failed with state: ${job.state}\n\nNo detailed failure information available.`;
  }

  return "No specific failure details provided";
})()}

## Query Submitted
\`\`\`sql
${cleanedQuery}
\`\`\`

## Complete Job Response
\`\`\`json
${JSON.stringify(job, null, 2)}
\`\`\`

${
  additionalInfo
    ? `## Additional Information\n\`\`\`json\n${JSON.stringify(additionalInfo, null, 2)}\n\`\`\``
    : ""
}
`;

  try {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Bug report created successfully at ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(
      `❌ Error creating bug report: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return "";
  }
}
