import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/hotel.activities';

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 seconds',
  retry: { maximumAttempts: 3, initialInterval: '1 second' },
});

export async function compareHotelOffers(city: string) {
  const supplierResults = await Promise.all([
    activity.fetchSupplierA(city),
    activity.fetchSupplierB(city),
  ]);
  return activity.mergeAndCacheOffers(city, supplierResults);
}
