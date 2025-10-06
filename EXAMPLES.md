# Narrative I/O Query Executor Examples

This document contains examples of common operations using the query executor.

## Querying Data

### Basic Query from File

```bash
bun run query_executor.ts -f resources/sql/analytics/match_rate.sql
```

### Basic Query with Limit

```bash
bun run query_executor.ts -f resources/sql/analytics/delivery_analysis.sql -l 100
```

### Inline Query

```bash
bun run query_executor.ts -q "SELECT * FROM MATCH_TABLE_US LIMIT 10"
```

### Create View Instead of Materialized View

```bash
bun run query_executor.ts -f resources/sql/analytics/overlap_report.sql -v
```

### Custom Polling Interval

```bash
bun run query_executor.ts -f resources/sql/analytics/match_rate.sql -p 5
```

### No Polling (Background Job)

```bash
bun run query_executor.ts -f resources/sql/analytics/delivery_analysis.sql --no-poll
```

## Snowflake Operations

### Basic Snowflake Query

```bash
bun run query_executor.ts --snowflake -q "SELECT * FROM company_data.dataset_1 LIMIT 10"
```

### Snowflake Query with Column Selection and Limit

```bash
bun run query_executor.ts --snowflake -q "SELECT email FROM company_data.dataset_1" --columns "email" -l 5
```

### Using Bind Parameters

```bash
bun run query_executor.ts --snowflake -q "SELECT * FROM company_data.dataset_1 WHERE country = ?" --binds '["US"]'
```

### Custom Snowflake Config

```bash
bun run query_executor.ts --snowflake -q "SELECT * FROM company_data.dataset_1 LIMIT 5" --snowflake-config '{"warehouse":"COMPUTE_WH","role":"ANALYST_ROLE"}'
```

## Dataset Management

### List All Datasets

```bash
bun run query_executor.ts --list-datasets
```

### Sample Data from Dataset

```bash
bun run query_executor.ts --sample-dataset 12345 --limit 20
```

### Sample Specific Columns

```bash
bun run query_executor.ts --sample-dataset 12345 --columns "email,created_at" --limit 10
```

### Delete Dataset

```bash
bun run query_executor.ts --delete-dataset 12345
```

### Interactive Dataset Deletion

```bash
bun run query_executor.ts --delete-dataset interactive
```

## Dataset Mapping

### Map Dataset to Attributes

```bash
bun run query_executor.ts --map-dataset 12345 --map-file resources/json/mappings/audience_dataset_mappings.json
```

## Rollback Operations

### Rollback to Specific Timestamp

```bash
bun run query_executor.ts --rollback "2025-03-01T12:00:00Z"
```

### Interactive Rollback

```bash
bun run query_executor.ts --rollback interactive
```

## Logging

### Enable Logging

```bash
bun run query_executor.ts -f resources/sql/analytics/match_rate.sql --log
```

### Display Query Log

```bash
bun run query_executor.ts --show-log
```

## Scripting Support

### Output Dataset ID for Scripts

```bash
DATASET_ID=$(bun run query_executor.ts -f resources/sql/analytics/match_rate.sql --output-dataset-id)
echo "Created dataset: $DATASET_ID"
```

## Combined Examples

### Create Dataset and Map Attributes

```bash
DATASET_ID=$(bun run query_executor.ts -f resources/sql/bootstrap/010_query.sql --output-dataset-id)
bun run query_executor.ts --map-dataset $DATASET_ID --map-file resources/json/mappings/dataset_mappings.json
```

### Query with Custom Data Plane

```bash
bun run query_executor.ts -f resources/sql/analytics/overlap_report.sql -d custom-data-plane-id
```
