import { buildServer } from "./server.js";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

async function start(): Promise<void> {
  const server = await buildServer();

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    server.log.info({ signal }, "shutdown signal received");
    try {
      await server.close();
      process.exit(0);
    } catch (error) {
      server.log.error({ error }, "error during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await server.listen({ port, host });
  } catch (error) {
    server.log.error({ error }, "failed to start server");
    process.exit(1);
  }
}

void start();
