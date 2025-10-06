import type { ApiRecords } from "@narrative.io/data-collaboration-sdk-ts";
/**
 * Utility functions for displaying tabular data in the CLI
 */
import Table from "cli-table3";

/**
 * Options for formatting the table display
 */
export interface TableDisplayOptions {
  /**
   * Maximum number of records to display
   * @default 10
   */
  maxRows?: number;

  /**
   * Maximum string length for cell values
   * @default 50
   */
  maxCellLength?: number;

  /**
   * Table title to display above the table
   */
  title?: string;

  /**
   * Columns to include (if not specified, all columns are included)
   */
  columns?: string[];
}

/**
 * Format the provided data as a CLI table and return the string representation
 */
export function formatTableData(
  data:
    | Record<string, string | number | boolean | null | undefined | unknown>[]
    | ApiRecords<Record<string, string>>,
  options: TableDisplayOptions = {},
): string {
  // Set default options
  const maxRows = options.maxRows ?? 10;
  const maxCellLength = options.maxCellLength ?? 50;

  // If ApiRecords format, extract the records array
  const records = "records" in data ? data.records : data;

  if (!records || records.length === 0) {
    return "No data available";
  }

  // Get headers - either from options.columns or from the first record
  let headers: string[];
  if (options.columns && options.columns.length > 0) {
    headers = options.columns;
  } else {
    // Get all unique headers from all records
    const headerSet = new Set<string>();
    for (const record of records) {
      for (const key in record) {
        headerSet.add(key);
      }
    }
    headers = Array.from(headerSet);
  }

  // Format cell value for display
  const formatCell = (value: unknown): string => {
    if (value === null || value === undefined) {
      return "";
    }

    // Special handling for objects
    if (typeof value === "object") {
      try {
        // Try to stringify it nicely
        const json = JSON.stringify(value);
        if (json === "{}") return "{}";
        if (json === "[]") return "[]";

        // For short objects, show the whole thing
        if (json.length <= maxCellLength) {
          return json;
        }

        // For longer objects, show a compact representation
        if (Array.isArray(value)) {
          return `Array(${value.length})`;
        }

        // For other objects, show the keys
        const keys = Object.keys(value as object);
        if (keys.length <= 3) {
          return `{${keys.join(", ")}}`;
        }
        return `{${keys.slice(0, 2).join(", ")}, ...}`;
      } catch (e) {
        return typeof value;
      }
    }

    // For other values, just use string representation with max length
    const stringValue = String(value);
    return stringValue.length > maxCellLength
      ? `${stringValue.substring(0, maxCellLength - 3)}...`
      : stringValue;
  };

  // Create a new table with improved formatting
  const table = new Table({
    head: headers,
    style: {
      head: ["cyan"],
      border: ["grey"],
    },
    wordWrap: true,
    truncate: "…",
    colWidths: headers.map((header) => {
      // Calculate optimal width for each column
      // Start with minimum width based on header length
      const headerWidth = header.length + 2;

      // Check content in first 20 rows to determine appropriate width
      let maxContentWidth = 0;
      for (const row of records.slice(0, Math.min(20, records.length))) {
        const value = row[header];
        if (value === null || value === undefined) continue;

        const strValue = String(value);

        // For objects, use a compact representation
        if (typeof value === "object") {
          maxContentWidth = Math.max(maxContentWidth, 15);
        } else {
          // For strings, use real length but cap it
          maxContentWidth = Math.max(maxContentWidth, Math.min(strValue.length, 30));
        }
      }

      // Use the maximum of header width and content width, with some reasonable bounds
      return Math.max(
        Math.min(maxContentWidth + 2, 30), // Add padding, cap at 30
        headerWidth,
        10, // Minimum width
      );
    }),
  });

  // Add rows to the table, limiting to maxRows
  const rowsToShow = records.slice(0, maxRows);
  for (const row of rowsToShow) {
    const tableRow = headers.map((header) => formatCell(row[header]));
    table.push(tableRow);
  }

  // Build the final output
  let output = "";

  // Add title if provided with better formatting
  if (options.title) {
    // Add some spacing for better readability
    output += "\n";
    // Add a box around the title for better visibility
    const title = options.title;
    // Calculate exactly how many characters we need for perfect alignment
    const titleLength = title.length;
    const horizontalPadding = 2; // Padding on left and right of title text

    // Calculate the exact width needed for perfect box alignment
    const boxWidth = titleLength + horizontalPadding * 2;

    // Create perfectly aligned box
    output += `┌${"─".repeat(boxWidth)}┐\n`;
    output += `│${" ".repeat(horizontalPadding)}${title}${" ".repeat(horizontalPadding)}│\n`;
    output += `└${"─".repeat(boxWidth)}┘\n\n`;
  }

  // Add the table
  output += table.toString();

  // Add record count information
  const totalCount = records.length;
  if (totalCount > maxRows) {
    output += `\n\nShowing ${maxRows} of ${totalCount} records`;
  } else {
    output += `\n\nTotal records: ${totalCount}`;
  }

  return output;
}

/**
 * Print tabular data to the console
 */
export function displayTable(
  data: Record<string, unknown>[] | ApiRecords<Record<string, string>>,
  options: TableDisplayOptions = {},
): void {
  const tableString = formatTableData(data, options);
  console.log(tableString);
}
