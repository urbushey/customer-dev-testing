# Narrative I/O Query Executor

A command-line tool for executing queries against the Narrative I/O API and Snowflake.

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Create a `.env` file with your credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your actual tokens
   ```

3. Format and lint code:
   ```bash
   # Format code
   bun run format
   
   # Check for linting issues
   bun run lint
   
   # Fix linting issues
   bun run lint:fix
   ```

## Usage

```bash
bun query_executor.ts [OPTIONS]
```

### Quick Examples

```bash
# Execute a query from a file
bun run query_executor.ts -f path/to/query.sql -d your_data_plane_id

# Execute an inline query
bun run query_executor.ts -q "SELECT * FROM your_table" -d your_data_plane_id -l 100

# List all datasets
bun run query_executor.ts --list-datasets

# Sample data from a dataset
bun run query_executor.ts --sample-dataset dataset_id --columns "col1,col2" --limit 20

# Run a direct Snowflake query
bun run query_executor.ts --snowflake --query "SELECT * FROM your_table LIMIT 10"
```

### Cursor Integration

Run SQL queries directly from Cursor using the Command Palette:

#### Using the Command Palette

1. Open a SQL file in Cursor
2. Press `Ctrl+Shift+P` to open the Command Palette
3. Type "Tasks: Run Task" and select it
4. Choose one of these tasks:
   - 🚀 **Run Current SQL File** - Standard execution
   - 🔢 **Run SQL (Limit 1000 Rows)** - Limit to 1000 rows
   - ⏱️ **Run SQL (No Result Polling)** - Don't wait for results
   - 🕒 **Run SQL (5s Poll Interval)** - Poll every 5 seconds

#### Quick Access With Run Build Task

1. Open a SQL file in Cursor
2. Press `Ctrl+Shift+B` (Run Build Task)
3. This will directly run the default task (Run Current SQL File)
4. Or select from the task list that appears

## Options

```
  -q, --query TEXT           SQL query to execute (inline)
  -f, --file TEXT            File containing SQL query
  -d, --data-plane-id TEXT   Data plane ID (defaults to env var)
  -l, --limit NUMBER         Row limit for query results
  -h, --help                 Show this help message
  --no-poll                  Don't poll for job completion
  -p, --poll-interval NUM    Polling interval in seconds (default: 2)
  -v, --create-view          Create result as a view instead of a materialized view
  --ld, --list-datasets      List all available datasets
  --dd, --delete-dataset ID  Delete a dataset by ID
  -s, --sample-dataset ID    Fetch and display a sample of data from a dataset
  --columns                  Comma-separated list of columns to include in sample
  -m, --map-dataset ID       Map a dataset to attributes
  -mf, --map-file PATH       JSON file containing attribute mappings
  --log                      Enable logging of queries and results
  --show-log                 Display the query execution log
  --rollback TIMESTAMP       Rollback to a specific timestamp (or 'interactive')
  --output-dataset-id, -oid  Output dataset ID in a format that can be captured by scripts
  
  # Direct Snowflake Connection
  -sf, --snowflake           Use direct Snowflake connection
  --snowflake-config JSON    Snowflake configuration as JSON
  --binds JSON               Bind parameters for Snowflake query
```

## Environment Variables

```
  NIO_API_TOKEN              API token for Narrative I/O
  NIO_DATA_PLANE_ID          Default data plane ID
  NIO_DEFAULT_EXECUTION_CLUSTER  Default executionc luster: "dedicated" or "shared" (optional)
  
  # Snowflake Connection (when using --snowflake)
  SNOWFLAKE_ACCOUNT          Snowflake account identifier
  SNOWFLAKE_USERNAME         Snowflake username
  SNOWFLAKE_PASSWORD         Snowflake password
  SNOWFLAKE_ROLE             (Optional) Snowflake role
  SNOWFLAKE_WAREHOUSE        (Optional) Snowflake warehouse
  SNOWFLAKE_DATABASE         (Optional) Snowflake database
  SNOWFLAKE_SCHEMA           (Optional) Snowflake schema
  SNOWFLAKE_PRIVATE_KEY      (Optional) Snowflake private key for key pair auth
  SNOWFLAKE_PRIVATE_KEY_PATH (Optional) Path to private key file
  SNOWFLAKE_PRIVATE_KEY_PASS (Optional) Passphrase for private key
```
## Project: test123
This is a project instance of the NQL workbench.
