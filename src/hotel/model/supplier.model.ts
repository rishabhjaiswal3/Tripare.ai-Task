import { config } from '../../config/env';
import { AppError } from '../../utils/app-error';
import type { SupplierHotel, SupplierName } from '../../types';

export class SupplierModel {
  async findHotels(supplier: SupplierName, city: string): Promise<SupplierHotel[]> {
    const baseUrl = supplier === 'Supplier A' ? config.supplierAUrl : config.supplierBUrl;
    const url = new URL(baseUrl);
    url.searchParams.set('city', city);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(config.supplierTimeoutMs) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body: unknown = await response.json();
      if (!Array.isArray(body)) throw new Error('Expected array response');
      return body as SupplierHotel[];
    } catch (error) {
      console.error(`[supplier] ${supplier} request to ${url.origin}${url.pathname} failed:`, error instanceof Error ? error.message : error);
      throw new AppError(`${supplier} is unavailable.`, 502, 'SUPPLIER_UNAVAILABLE');
    }
  }
}
