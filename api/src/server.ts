import { buildApp } from './app.js';

async function startServer(): Promise<void> {
  const { app, config, db } = await buildApp();

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'Received shutdown signal, closing Pearl Travel API...');
    try {
      await app.close();
      process.exit(0);
    } catch (error) {
      app.log.error(error, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  const dbHealth = await db.checkHealth();
  if (dbHealth.status === 'healthy') {
    app.log.info(
      { database: dbHealth.database, role: dbHealth.role, latencyMs: dbHealth.latencyMs },
      'Connected to PostgreSQL database'
    );
  } else {
    app.log.warn(
      { dbStatus: dbHealth.status, reason: dbHealth.error },
      'PostgreSQL database is not healthy or not configured yet; /health/database will report 503'
    );
  }

  await app.listen({
    host: config.host,
    port: config.port,
  });

  app.log.info(`Pearl Travel API listening on http://${config.host}:${config.port}`);
}

startServer().catch((error) => {
  console.error('[server] Failed to start Pearl Travel API:', error);
  process.exit(1);
});
