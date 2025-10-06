/**
 * CLI-related types for the query executor
 */

export interface CommandLineArgs {
  "--query": string;
  "--file": string;
  "--data-plane-id": string;
  "--limit": string;
  "--help": boolean;
  "--no-poll": boolean;
  "--poll-interval": string;
  "--list-datasets": boolean;
  "--delete-dataset": string;
  "--log": boolean;
  "--show-log": boolean;
  "--rollback": string;
  "--create-view": boolean;
  "--snowflake": boolean;
  "--snowflake-config": string;
  "--binds": string;
  "--sample-dataset": string;
  "--columns": string;
  "--map-dataset": string;
  "--map-file": string;
  "--output-dataset-id": boolean;
  "--api-base-url": string;
  "--verbose": boolean;
  "-q": string;
  "-f": string;
  "-d": string;
  "-l": string;
  "-h": boolean;
  "-p": string;
  "-v": boolean;
  "-sf": boolean;
  "--ld": boolean;
  "--dd": string;
  "-s": string;
  "-m": string;
  "-mf": string;
  "-oid": boolean;
}
