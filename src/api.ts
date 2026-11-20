import { createApp } from './app';
import { config } from './config/env';

export function startApi() {
  const server = createApp().listen(config.port, () => console.info(`[api] listening on port ${config.port}`));
  return server;
}

if (require.main === module) startApi();
