/**
 * Command line argument parsing
 */

import type { CommandLineArgs } from "../types/cli";

/**
 * Parse command line arguments
 */
export function parseArgs(args: string[]): Partial<CommandLineArgs> {
  const parsedArgs: Partial<CommandLineArgs> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--query":
      case "-q":
        parsedArgs["--query"] = nextArg;
        i++;
        break;
      case "--file":
      case "-f":
        parsedArgs["--file"] = nextArg;
        i++;
        break;
      case "--data-plane-id":
      case "-d":
        parsedArgs["--data-plane-id"] = nextArg;
        i++;
        break;
      case "--limit":
      case "-l":
        parsedArgs["--limit"] = nextArg;
        i++;
        break;
      case "--poll-interval":
      case "-p":
        parsedArgs["--poll-interval"] = nextArg;
        i++;
        break;
      case "--no-poll":
        parsedArgs["--no-poll"] = true;
        break;
      case "--list-datasets":
      case "--ld":
        parsedArgs["--list-datasets"] = true;
        break;
      case "--delete-dataset":
      case "--dd":
        parsedArgs["--delete-dataset"] = nextArg;
        i++;
        break;
      case "--log":
        parsedArgs["--log"] = true;
        console.log('🔍 Setting parsedArgs["--log"] = true');
        break;
      case "--show-log":
        parsedArgs["--show-log"] = true;
        break;
      case "--rollback":
        parsedArgs["--rollback"] = nextArg;
        i++;
        break;
      case "--create-view":
      case "-v":
        parsedArgs["--create-view"] = true;
        break;
      case "--snowflake":
      case "-sf":
        parsedArgs["--snowflake"] = true;
        break;
      case "--snowflake-config":
        parsedArgs["--snowflake-config"] = nextArg;
        i++;
        break;
      case "--binds":
        parsedArgs["--binds"] = nextArg;
        i++;
        break;
      case "--sample-dataset":
      case "-s":
        parsedArgs["--sample-dataset"] = nextArg;
        i++;
        break;
      case "--columns":
        parsedArgs["--columns"] = nextArg;
        i++;
        break;
      case "--help":
      case "-h":
        parsedArgs["--help"] = true;
        break;
      case "--map-dataset":
      case "-m":
        parsedArgs["--map-dataset"] = nextArg;
        i++;
        break;
      case "--map-file":
      case "-mf":
        parsedArgs["--map-file"] = nextArg;
        i++;
        break;
      case "--output-dataset-id":
      case "-oid":
        parsedArgs["--output-dataset-id"] = true;
        break;
      case "--api-base-url":
        parsedArgs["--api-base-url"] = nextArg;
        i++;
        break;
      case "--verbose":
        parsedArgs["--verbose"] = true;
        break;
    }
  }

  return parsedArgs;
}
