/**
 * Git-related utility functions
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Check if we're on the main branch and create an adhoc branch if needed
 * @returns Object containing the original branch name and whether a branch was created
 */
export function ensureNotOnMainBranch(): { originalBranch: string; branchCreated: boolean } {
  // Get current branch
  const branchResult = spawnSync("git", ["branch", "--show-current"], { encoding: "utf8" });
  const currentBranch = branchResult.stdout.trim();

  if (currentBranch === "main") {
    console.log("⚠️  Query executor should not be run on main branch.");
    console.log("🔄 Creating adhoc branch for query execution...");

    // Create timestamp for branch name
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);
    const newBranchName = `adhoc-query-${timestamp}`;

    // Create and checkout new branch
    const createBranchResult = spawnSync("git", ["checkout", "-b", newBranchName], {
      encoding: "utf8",
    });

    if (createBranchResult.status !== 0) {
      console.error(`❌ Failed to create branch: ${createBranchResult.stderr}`);
      process.exit(1);
    }

    console.log(`✅ Created and switched to new branch: ${newBranchName}`);
    return { originalBranch: "main", branchCreated: true };
  }

  return { originalBranch: currentBranch, branchCreated: false };
}

/**
 * Commit the query file to the current branch after successful execution
 * @param filePath Path to the query file that was executed
 * @param success Whether the query execution was successful
 */
export function commitQueryFile(filePath: string, success: boolean): string | undefined {
  if (!success || !filePath || !fs.existsSync(filePath)) {
    return;
  }

  console.log(
    `\n💾 Committing query file ${filePath} to current branch after successful execution...`,
  );

  // Add the file
  const addResult = spawnSync("git", ["add", filePath], { encoding: "utf8" });
  if (addResult.status !== 0) {
    console.error(`⚠️ Could not add file: ${addResult.stderr}`);
    return;
  }

  // Get the current commit hash
  const hashResult = spawnSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" });
  const commitHash = hashResult.status === 0 ? hashResult.stdout.trim() : "unknown";

  // Create commit message
  const commitMsg = `feat: Add successfully executed query ${path.basename(filePath)}`;

  // Commit the file
  const commitResult = spawnSync("git", ["commit", "-m", commitMsg, "--no-gpg-sign"], {
    encoding: "utf8",
  });

  if (commitResult.status !== 0) {
    console.error(`⚠️ Could not commit file: ${commitResult.stderr}`);
    return;
  }

  console.log("✅ Successfully committed query file to current branch.");
  console.log("💡 Push this branch with: git push -u origin HEAD");

  // Return the commit hash for logging
  return commitHash;
}
