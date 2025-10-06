import { createPrivateKey } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { Connection, ConnectionOptions, Statement, createConnection } from "snowflake-sdk";
import { getEnvVar } from "../config/environment";
import { logger } from "../utils/logger";

export interface SnowflakeConfig {
  account: string;
  username: string;
  password?: string;
  privateKey?: string;
  privateKeyPath?: string;
  privateKeyPass?: string;
  role?: string;
  warehouse?: string;
  database?: string;
  schema?: string;
}

export interface QueryResult {
  data: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
  status: string;
}

export class SnowflakeService {
  private config: SnowflakeConfig;
  private tempKeyPath: string | null = null;

  constructor(config: SnowflakeConfig) {
    this.config = config;
  }

  /**
   * Create a connection to Snowflake
   */
  public async createConnection(): Promise<Connection> {
    // Create the connection options
    const connectionOptions: ConnectionOptions = {
      account: this.config.account,
      username: this.config.username,
      role: this.config.role,
      warehouse: this.config.warehouse,
      database: this.config.database,
      schema: this.config.schema,
    };

    // Handle authentication methods
    if (this.config.password) {
      // Password authentication
      connectionOptions.password = this.config.password;
    } else if (this.config.privateKey || this.config.privateKeyPath) {
      // Private key authentication
      connectionOptions.authenticator = "SNOWFLAKE_JWT";

      // If we have a privateKey string but no privateKeyPath, create a temporary file
      if (this.config.privateKey && !this.config.privateKeyPath) {
        try {
          // Format the key if needed
          let formattedKey = this.config.privateKey;
          if (!formattedKey.includes("-----BEGIN PRIVATE KEY-----")) {
            formattedKey = [
              "-----BEGIN PRIVATE KEY-----",
              ...(formattedKey.match(/.{1,64}/g) || []),
              "-----END PRIVATE KEY-----",
            ].join("\n");
          }

          // Validate the key format
          try {
            createPrivateKey({ key: formattedKey, format: "pem" });
          } catch (error) {
            logger.error("Invalid private key format:", error);
            throw new Error("Invalid private key format");
          }

          // Create a temporary file with the key
          this.tempKeyPath = path.join(process.cwd(), "temp_snowflake_key.pem");
          fs.writeFileSync(this.tempKeyPath, formattedKey, { mode: 0o600 });
          logger.info(`Created temporary private key file at ${this.tempKeyPath}`);

          // Use the temporary file path
          connectionOptions.privateKeyPath = this.tempKeyPath;
        } catch (error) {
          logger.error("Error formatting private key:", error);
          throw error;
        }
      } else if (this.config.privateKeyPath) {
        // Use the provided private key path
        connectionOptions.privateKeyPath = this.config.privateKeyPath;
      }

      // Add private key password if provided
      if (this.config.privateKeyPass) {
        connectionOptions.privateKeyPass = this.config.privateKeyPass;
      }
    }

    logger.info("Creating new connection object");
    const connection = createConnection(connectionOptions);

    return new Promise<Connection>((resolve, reject) => {
      connection.connect((err, conn) => {
        if (err) {
          logger.error("Error connecting to Snowflake:", err);
          // Clean up temp file if connection fails
          this.cleanupTempKeyFile();
          reject(err);
          return;
        }
        logger.info("Successfully connected to Snowflake");
        resolve(conn);
      });
    });
  }

  /**
   * Execute a query on Snowflake
   * @param sql The SQL query to execute
   * @param binds Optional bind parameters
   */
  public async executeQuery(sql: string, binds?: unknown[]): Promise<QueryResult> {
    const connection = await this.createConnection();

    return new Promise<QueryResult>((resolve, reject) => {
      connection.execute({
        sqlText: sql,
        binds: binds || [],
        complete: (err, stmt, rows) => {
          if (err) {
            logger.error("Error executing query:", err);
            this.closeConnection(connection).catch((closeErr) => {
              logger.error("Additional error closing connection:", closeErr);
            });
            reject(err);
            return;
          }

          const result: QueryResult = {
            data: rows || [],
            columns: stmt.getColumns().map((col) => col.getName()),
            rowCount: stmt.getNumRows(),
            status: stmt.getStatus(),
          };

          this.closeConnection(connection)
            .then(() => {
              resolve(result);
            })
            .catch((closeErr) => {
              logger.error("Error closing connection:", closeErr);
              // Still resolve with the result even if closing fails
              resolve(result);
            });
        },
      });
    });
  }

  /**
   * Close a Snowflake connection
   * @param connection The connection to close
   */
  public closeConnection(connection: Connection): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      connection.destroy((err) => {
        if (err) {
          logger.error("Error closing Snowflake connection:", err);
          // Try to clean up temp file even if connection close fails
          this.cleanupTempKeyFile();
          reject(err);
          return;
        }
        logger.info("Snowflake connection closed");
        // Clean up temporary key file
        this.cleanupTempKeyFile();
        resolve();
      });
    });
  }

  /**
   * Clean up temporary key file if it exists
   */
  private cleanupTempKeyFile(): void {
    if (this.tempKeyPath && fs.existsSync(this.tempKeyPath)) {
      try {
        fs.unlinkSync(this.tempKeyPath);
        logger.info(`Removed temporary private key file: ${this.tempKeyPath}`);
        this.tempKeyPath = null;
      } catch (error) {
        logger.error(`Error removing temporary private key file: ${error}`);
      }
    }
  }

  /**
   * Create Snowflake service from environment variables
   */
  public static fromEnv(): SnowflakeService {
    const config: SnowflakeConfig = {
      account: getEnvVar("SNOWFLAKE_ACCOUNT"),
      username: getEnvVar("SNOWFLAKE_USERNAME"),
      password: process.env.SNOWFLAKE_PASSWORD,
      role: process.env.SNOWFLAKE_ROLE,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
    };

    // Support private key authentication as an alternative to password
    if (process.env.SNOWFLAKE_PRIVATE_KEY) {
      config.privateKey = process.env.SNOWFLAKE_PRIVATE_KEY;
    } else if (process.env.SNOWFLAKE_PRIVATE_KEY_PATH) {
      config.privateKeyPath = process.env.SNOWFLAKE_PRIVATE_KEY_PATH;
      if (process.env.SNOWFLAKE_PRIVATE_KEY_PASS) {
        config.privateKeyPass = process.env.SNOWFLAKE_PRIVATE_KEY_PASS;
      }
    }

    return new SnowflakeService(config);
  }
}
