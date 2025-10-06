import { describe, expect, it, mock } from "bun:test";
import { SnowflakeService } from "../src/services/snowflake-service";

describe("SnowflakeService", () => {
  it("should create a properly configured instance from constructor", () => {
    const config = {
      account: "my-account",
      username: "my-user",
      password: "my-password",
    };

    const service = new SnowflakeService(config);
    expect(service).toBeInstanceOf(SnowflakeService);
  });

  it("should handle environment configuration with required values", () => {
    // Mock environment variables
    process.env.SNOWFLAKE_ACCOUNT = "test-account";
    process.env.SNOWFLAKE_USERNAME = "test-user";
    process.env.SNOWFLAKE_PASSWORD = "test-password";

    const service = SnowflakeService.fromEnv();
    expect(service).toBeInstanceOf(SnowflakeService);
  });

  it("should handle environment configuration with all possible values", () => {
    // Mock environment variables
    process.env.SNOWFLAKE_ACCOUNT = "test-account";
    process.env.SNOWFLAKE_USERNAME = "test-user";
    process.env.SNOWFLAKE_PASSWORD = "test-password";
    process.env.SNOWFLAKE_ROLE = "test-role";
    process.env.SNOWFLAKE_WAREHOUSE = "test-warehouse";
    process.env.SNOWFLAKE_DATABASE = "test-database";
    process.env.SNOWFLAKE_SCHEMA = "test-schema";

    const service = SnowflakeService.fromEnv();
    expect(service).toBeInstanceOf(SnowflakeService);
  });

  it("should handle environment configuration with private key", () => {
    // Mock environment variables
    process.env.SNOWFLAKE_ACCOUNT = "test-account";
    process.env.SNOWFLAKE_USERNAME = "test-user";
    process.env.SNOWFLAKE_PRIVATE_KEY = "test-private-key";

    const service = SnowflakeService.fromEnv();
    expect(service).toBeInstanceOf(SnowflakeService);
  });

  it("should handle environment configuration with private key path", () => {
    // Mock environment variables
    process.env.SNOWFLAKE_ACCOUNT = "test-account";
    process.env.SNOWFLAKE_USERNAME = "test-user";
    process.env.SNOWFLAKE_PRIVATE_KEY_PATH = "/path/to/key";
    process.env.SNOWFLAKE_PRIVATE_KEY_PASS = "test-pass";

    const service = SnowflakeService.fromEnv();
    expect(service).toBeInstanceOf(SnowflakeService);
  });
});
