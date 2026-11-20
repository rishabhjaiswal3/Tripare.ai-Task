import { createApp } from './app';
import { config } from './config/env';

createApp().listen(config.port, () => console.info(`[api] listening on port ${config.port}`));
