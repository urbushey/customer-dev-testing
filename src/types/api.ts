/**
 * API response types for the Narrative I/O API
 */ export interface NIOQueryOptions {
  nql: string;
  data_plane_id: string;
  company_id?: string;
  limit?: number;
  poll?: boolean;
  poll_interval?: number;
  create_as_view?: boolean;
  output_dataset_id?: boolean;
  execution_cluster?: { type: "dedicated" | "shared" };
}
