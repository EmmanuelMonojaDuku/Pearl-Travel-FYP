import type { QueryResult, QueryResultRow } from 'pg';

export interface QueryExecutor {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: readonly unknown[]
  ): Promise<QueryResult<T>>;
}

export interface DatabaseClient extends QueryExecutor {
  isConfigured(): boolean;
  transaction<T>(fn: (tx: QueryExecutor) => Promise<T>): Promise<T>;
  checkHealth(): Promise<DatabaseHealthStatus>;
  close(): Promise<void>;
}

export interface DatabaseHealthStatus {
  status: 'healthy' | 'unconfigured' | 'unhealthy';
  configured: boolean;
  latencyMs?: number;
  database?: string;
  role?: string;
  pool?: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
  error?: string;
}
