
import { NativeConnection, Worker } from '@temporalio/worker';
import { config } from './config/env';
import * as activities from './temporal/activities/hotel.activities';
import { temporalConnectionOptions } from './temporal/connection.options';

export async function startTemporalWorker() {
  const connection = await NativeConnection.connect(temporalConnectionOptions());
  const worker = await Worker.create({
    connection,
    namespace: config.temporalNamespace,
    taskQueue: config.temporalTaskQueue,
    workflowsPath: require.resolve('./temporal/workflows/hotel.workflow'),
    activities,
  });
  console.info(`[worker] listening on ${config.temporalTaskQueue}`);
  const run = worker.run();
  return {
    run,
    async shutdown(): Promise<void> {
      worker.shutdown();
      try {
        await run;
      } finally {
        await connection.close();
      }
    },
  };
}

if (require.main === module) {
  startTemporalWorker()
    .then(({ run }) => run)
    .catch((error) => {
      console.error('[worker] stopped unexpectedly', error);
      process.exitCode = 1;
    });
}

