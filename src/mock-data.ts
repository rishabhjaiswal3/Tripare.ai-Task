
import type { SupplierHotel } from './types';

const supplierA: SupplierHotel[] = [
  { hotelId: 'a1', name: 'Holtin', price: 6000, city: 'delhi', commissionPct: 10 },
  { hotelId: 'a2', name: 'Radison', price: 5900, city: 'delhi', commissionPct: 13 },
  { hotelId: 'a3', name: 'The Grand', price: 7200, city: 'delhi', commissionPct: 12 },
  { hotelId: 'a4', name: 'Holtin', price: 5800, city: 'mumbai', commissionPct: 10 },
];

const supplierB: SupplierHotel[] = [
  { hotelId: 'b1', name: 'Holtin', price: 5340, city: 'delhi', commissionPct: 20 },
  { hotelId: 'b2', name: 'Radison', price: 6100, city: 'delhi', commissionPct: 15 },
  { hotelId: 'b3', name: 'Sea View', price: 4800, city: 'mumbai', commissionPct: 18 },
  { hotelId: 'b4', name: 'The Grand', price: 7200, city: 'delhi', commissionPct: 17 },
];

export function hotelsFromSupplier(supplier: 'A' | 'B', city: string): SupplierHotel[] {
  const source = supplier === 'A' ? supplierA : supplierB;
  return source.filter((hotel) => hotel.city.toLowerCase() === city.toLowerCase());
}


