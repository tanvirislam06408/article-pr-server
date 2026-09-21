import { Pool, QueryResult, QueryResultRow } from "pg";
import { config } from "./env";

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === "development" && duration > 200) {
      console.log(`Executed query in ${duration}ms:`, { text, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error("Database query error:", { text, error });
    throw error;
  }
};

export const testDbConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    console.log("PostgreSQL connected successfully at:", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error);
    return false;
  }
};
