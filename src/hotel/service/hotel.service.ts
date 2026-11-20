import type { HotelOffer, SupplierHotel, SupplierName, SupplierResult } from '../../types';
import { HotelModel } from '../model/hotel.model';
import { TemporalModel } from '../../temporal/temporal.model';

export class HotelService {
  constructor(private readonly model: HotelModel, private readonly temporal: TemporalModel) {}

  async list(city: string, minPrice?: number, maxPrice?: number): Promise<HotelOffer[]> {
    if (!(await this.model.exists(city))) {
      await this.temporal.compareHotelOffers(city);
    }
    return this.model.findByPrice(city, minPrice, maxPrice);
  }
}

export function selectBestOffers(results: SupplierResult[]): HotelOffer[] {
  const best = new Map<string, HotelOffer>();
  for (const { supplier, hotels } of results) {
    for (const hotel of hotels) {
      const key = hotel.name.trim().toLowerCase();
      if (!key || !Number.isFinite(hotel.price)) continue;
      const current = best.get(key);
      if (!current || hotel.price < current.price) best.set(key, toOffer(hotel, supplier));
    }
  }
  return [...best.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function toOffer(hotel: SupplierHotel, supplier: SupplierName): HotelOffer {
  return { name: hotel.name.trim(), price: hotel.price, supplier, commissionPct: hotel.commissionPct };
}
