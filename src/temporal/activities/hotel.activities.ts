import { SupplierModel } from '../../hotel/model/supplier.model';
import { HotelModel } from '../../hotel/model/hotel.model';
import type { SupplierName } from '../../types';
import { selectBestOffers } from '../../hotel/service/hotel.service';

const suppliers = new SupplierModel();
const cache = new HotelModel();

export async function fetchSupplierA(city: string) {
  return { supplier: 'Supplier A' as SupplierName, hotels: await suppliers.findHotels('Supplier A', city) };
}

export async function fetchSupplierB(city: string) {
  return { supplier: 'Supplier B' as SupplierName, hotels: await suppliers.findHotels('Supplier B', city) };
}

export async function mergeAndCacheOffers(city: string, results: Awaited<ReturnType<typeof fetchSupplierA>>[]) {
  const offers = selectBestOffers(results);
  await cache.saveAll(city, offers);
  return offers;
}
