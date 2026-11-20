import { Client, Connection } from '@temporalio/client';
import { config } from '../config/env';
import type { HotelOffer } from '../types';

export class TemporalModel {
  async compareHotelOffers(city: string): Promise<HotelOffer[]> {
    const connection = await Connection.connect({ address: config.temporalAddress });
    try {
      const client = new Client({ connection });
      const workflow = await client.workflow.start('compareHotelOffers', {
        taskQueue: config.temporalTaskQueue,
        workflowId: `hotel-offers-${city.toLowerCase()}-${Date.now()}`,
        args: [city.toLowerCase()],
      });
      return await workflow.result();
    } finally { await connection.close(); }
  }
}
