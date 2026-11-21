import { config } from '../config/env';

/** Shared connection options for the Temporal client and worker. */
export function temporalConnectionOptions() {
  const { temporalAddress: address, temporalApiKey: apiKey, temporalNamespace } = config;
  if (!apiKey) return { address };
  return {
    address,
    tls: true,
    apiKey,
    metadata: { 'temporal-namespace': temporalNamespace },
  };
}
