
import { NativeConnection, Worker } from '@temporalio/worker';
import { config } from './config/env';
import * as activities from './temporal/activities/hotel.activities';

async function run(): Promise<void> {
  const connection = await NativeConnection.connect({ address: config.temporalAddress });
  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: config.temporalTaskQueue,
    workflowsPath: require.resolve('./temporal/workflows/hotel.workflow'),
    activities,
  });
  console.info(`[worker] listening on ${config.temporalTaskQueue}`);
  await worker.run();
}

run().catch((error) => {
  console.error('[worker] stopped unexpectedly', error);
  process.exitCode = 1;
});

