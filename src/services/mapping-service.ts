/**
 * Service for mapping datasets to attributes
 */

import * as fs from "node:fs";
import { fetchDataset } from "../api/datasets";
import { isVerbose } from "../config/config";
import { getApiBaseUrl } from "../config/constants";
import { getApiToken } from "../config/environment";
import { fetchWithRetry } from "../utils/http";

/**
 * Mapping types for dataset-attribute mappings
 */
export type MappingStatus = "active" | "archived" | "pending" | "rejected";
export type MappingScope = "global" | "private";
export type MappingSource = "system" | "admin" | "company";

export interface PropertyMapping {
  path: string;
  expression: string;
}

export interface ObjectMapping {
  type: "object_mapping";
  property_mappings: PropertyMapping[];
}

export interface ValueMapping {
  type: "value_mapping";
  expression: string;
}

export interface Mapping {
  id: string;
  attribute_id: number;
  created_at: string;
  dataset_id: number;
  mapping: ObjectMapping | ValueMapping;
  status: MappingStatus;
  updated_at: string;
  created_by: number;
  updated_by: number;
  company_id: number;
  scope: MappingScope;
  source: MappingSource;
  derived_from: string;
  tags?: string[];
}

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type CreateMapping = WithOptional<
  Pick<Mapping, "attribute_id" | "dataset_id" | "mapping" | "tags" | "status">,
  "status"
>;

export interface MappingTestResult {
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

export interface MappingTestResults {
  records: MappingTestResult[];
}

export interface MappingResult {
  id: string;
  attribute_id: number;
  dataset_id: number;
  status: MappingStatus;
  created_at: string;
  created_by: number;
  updated_at: string;
  updated_by: number;
  mapping: ObjectMapping | ValueMapping;
}

export interface MappingOperationResult {
  attribute_id: number;
  success: boolean;
  result?: MappingResult;
  error?: string;
}

/**
 * Apply attribute mappings to a dataset
 * @param datasetId The ID of the dataset to map
 * @param mappingsFilePath Path to JSON file containing mappings array
 * @returns Results of the mapping operation
 */
export async function applyDatasetAttributeMappings(
  datasetId: string,
  mappingsFilePath: string,
): Promise<{ success: boolean; results: MappingOperationResult[] }> {
  try {
    // Read and parse the mappings file
    const fileContents = fs.readFileSync(mappingsFilePath, "utf-8");
    const mappings: CreateMapping[] = JSON.parse(fileContents);
    const dataset = await fetchDataset(Number(datasetId));

    if (!Array.isArray(mappings)) {
      throw new Error("Mappings file must contain a JSON array of attribute mappings");
    }

    console.log(`📊 Applying ${mappings.length} attribute mappings to dataset ${datasetId}`);

    // Process each mapping
    const results: MappingOperationResult[] = [];
    for (const mapping of mappings) {
      try {
        // Ensure dataset_id is set for the mapping
        const completeMapping: CreateMapping = replaceTableNamePlaceholders(
          {
            ...mapping,
            dataset_id: Number(datasetId),
          },
          dataset.name,
        );

        // Validate mapping has required fields
        if (!completeMapping.attribute_id) {
          throw new Error("Each mapping must include an attribute_id");
        }

        if (!completeMapping.mapping) {
          throw new Error("Each mapping must include a mapping definition");
        }

        const replaceMapping: CreateMapping = JSON.parse(
          JSON.stringify(completeMapping).replaceAll("{{TABLE_NAME}}", dataset.name),
        );

        // Apply the mapping
        const result = await mapDatasetAttribute(dataset.company_id, completeMapping);
        results.push({
          attribute_id: completeMapping.attribute_id,
          success: true,
          result,
        });

        console.log(`✅ Successfully mapped attribute ${completeMapping.attribute_id}`);
      } catch (error) {
        results.push({
          attribute_id: mapping.attribute_id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        console.error(
          `❌ Failed to map attribute ${mapping.attribute_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`\n📋 Mapping Results: ${successCount}/${mappings.length} successful`);

    return {
      success: successCount === mappings.length,
      results,
    };
  } catch (error) {
    console.error(
      `Error applying mappings: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
}

/**
 * Map a single attribute to a dataset
 * @param datasetId The dataset ID
 * @param mapping The attribute mapping to apply
 * @returns The result of the mapping operation
 */
async function mapDatasetAttribute(
  companyId: number,
  mapping: CreateMapping,
): Promise<MappingResult> {
  const apiToken = getApiToken();

  try {
    // Make API call to map the attribute
    const apiUrl = `${getApiBaseUrl()}/mappings/companies/${companyId}`;
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
      body: JSON.stringify(mapping),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error mapping attribute: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Error mapping attribute: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
}

function replaceTableNamePlaceholders(mapping: CreateMapping, tableName: string): CreateMapping {
  return JSON.parse(JSON.stringify(mapping), (key, value) => {
    if (typeof value === "string") {
      return value.replace(/\{\{TABLE_NAME\}\}/g, tableName);
    }
    return value;
  });
}
