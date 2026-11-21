import { Client, Connection } from '@temporalio/client';
import { config } from '../config/env';
import type { HotelOffer } from '../types';
import { temporalConnectionOptions } from './connection.options';

export class TemporalModel {
  async compareHotelOffers(city: string): Promise<HotelOffer[]> {
    const connection = await Connection.connect(temporalConnectionOptions());
    try {
      const client = new Client({ connection, namespace: config.temporalNamespace });
      const workflow = await client.workflow.start('compareHotelOffers', {
        taskQueue: config.temporalTaskQueue,
        workflowId: `hotel-offers-${city.toLowerCase()}-${Date.now()}`,
        args: [city.toLowerCase()],
      });
      return await workflow.result();
    } finally { await connection.close(); }
  }
}
