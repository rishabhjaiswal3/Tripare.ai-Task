import { startApi } from './api';
import { startTemporalWorker } from './worker';

async function startCombinedService(): Promise<void> {
  const worker = await startTemporalWorker();
  const api = startApi();
  let stopping = false;

  const shutdown = async (): Promise<void> => {
    if (stopping) return;
    stopping = true;
    const apiStopped = new Promise<void>((resolve) => api.close(() => resolve()));
    await Promise.allSettled([apiStopped, worker.shutdown()]);
  };

  process.once('SIGTERM', () => void shutdown());
  process.once('SIGINT', () => void shutdown());
  worker.run.catch(async (error) => {
    console.error('[render] Temporal worker stopped unexpectedly', error);
    await shutdown();
    process.exitCode = 1;
  });
}

startCombinedService().catch((error) => {
  console.error('[render] failed to start API and Temporal worker', error);
  process.exitCode = 1;
});
