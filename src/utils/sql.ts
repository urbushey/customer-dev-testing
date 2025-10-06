/**
 * SQL utility functions
 */

/**
 * Removes SQL comments from a SQL query string while preserving the original
 * SQL code structure. Handles both single-line (--) and multi-line comments.
 *
 * Important: This function carefully preserves:
 * - String literals (content in quotes won't be affected even if it contains comment syntax)
 * - SQL code structure and whitespace
 * - Line breaks to maintain SQL readability
 *
 * @param {string} sql - The SQL query string that may contain comments
 * @returns {string} SQL query with all comments removed
 *
 * @example
 * // Input: SELECT * FROM users -- Get all users
 * // Output: SELECT * FROM users
 *
 * @example
 * // Input: SELECT * FROM users [COMMENT] WHERE active = 1
 * // (where [COMMENT] is a multi-line comment)
 * // Output: SELECT * FROM users  WHERE active = 1
 */
export function stripSqlComments(sql: string): string {
  if (!sql) return sql;

  const result: string[] = [];
  let i = 0;
  const length = sql.length;

  let inSingleQuote = false;
  let inDoubleQuote = false;

  while (i < length) {
    // Handle string literals (to avoid mistaking quotes in comments as string literals)
    if (sql[i] === "'" && (i === 0 || sql[i - 1] !== "\\")) {
      inSingleQuote = !inSingleQuote;
      result.push(sql[i]);
      i++;
      continue;
    }

    if (sql[i] === '"' && (i === 0 || sql[i - 1] !== "\\")) {
      inDoubleQuote = !inDoubleQuote;
      result.push(sql[i]);
      i++;
      continue;
    }

    // If we're in a string literal, copy character as is
    if (inSingleQuote || inDoubleQuote) {
      result.push(sql[i]);
      i++;
      continue;
    }

    // Handle single-line comments (--)
    if (sql[i] === "-" && i + 1 < length && sql[i + 1] === "-") {
      // Skip until end of line
      i += 2;
      while (i < length && sql[i] !== "\n") {
        i++;
      }
      // Preserve the newline character
      if (i < length && sql[i] === "\n") {
        result.push("\n");
        i++;
      }
      continue;
    }

    // Handle multi-line comments (/* */)
    if (sql[i] === "/" && i + 1 < length && sql[i + 1] === "*") {
      i += 2;
      while (i + 1 < length && !(sql[i] === "*" && sql[i + 1] === "/")) {
        // Preserve newlines inside comments to maintain SQL structure
        if (sql[i] === "\n") {
          result.push("\n");
        }
        i++;
      }
      if (i + 1 < length) {
        i += 2; // Skip the closing */
      }
      // Remove any extra space before next non-whitespace character
      continue;
    }

    // If not in a comment, copy character as is
    result.push(sql[i]);
    i++;
  }

  return result.join("");
}

/**
 * Helper function to extract view name from a query
 */
export function extractViewName(query: string): string {
  // Normalize whitespace in the query
  const normalizedQuery = query.replace(/\s+/g, " ").trim();

  if (
    normalizedQuery.toUpperCase().includes("CREATE MATERIALIZED VIEW") ||
    normalizedQuery.toUpperCase().includes("CREATE OR REPLACE MATERIALIZED VIEW")
  ) {
    // First try to match quoted identifier
    let matches = normalizedQuery.match(
      /CREATE\s+(?:OR\s+REPLACE\s+)?MATERIALIZED\s+VIEW\s+"([^"]+)"/i,
    );
    if (matches?.[1]) {
      return matches[1].trim();
    }

    // Then try unquoted identifier
    matches = normalizedQuery.match(
      /CREATE\s+(?:OR\s+REPLACE\s+)?MATERIALIZED\s+VIEW\s+([^\s"]+)/i,
    );
    if (matches?.[1]) {
      // Remove any trailing AS if it was captured
      return matches[1].replace(/\s+AS$/i, "").trim();
    }
  }
  return "Unnamed view";
}

/**
 * Detects if a SQL query contains 'CREATE OR REPLACE' and removes the 'OR REPLACE' part if found.
 *
 * @param {string} query - The SQL query string to analyze
 * @returns {[boolean, string]} A tuple where:
 *   - First element is true if 'CREATE OR REPLACE' was found, false otherwise
 *   - Second element is the normalized query with 'OR REPLACE' removed if it was present
 *
 * @example
 * // Returns [true, "CREATE VIEW my_view AS SELECT * FROM table"]
 * isCreateOrReplace("CREATE OR REPLACE VIEW my_view AS SELECT * FROM table");
 *
 * @example
 * // Returns [false, "CREATE VIEW my_view AS SELECT * FROM table"]
 * isCreateOrReplace("CREATE VIEW my_view AS SELECT * FROM table");
 */
export function isCreateOrReplace(query: string): [boolean, string] {
  const normalizedQuery = query.replace(/\s+/g, " ").trim();

  if (/CREATE\s+OR\s+REPLACE/i.test(normalizedQuery)) {
    return [true, normalizedQuery.replace(/\s+OR\s+REPLACE/i, "")];
  }

  return [false, normalizedQuery];
}
