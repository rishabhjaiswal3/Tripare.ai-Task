import { AppError } from './app-error';

export function parsePriceRange(query: Record<string, unknown>): { minPrice?: number; maxPrice?: number } {
  const parse = (value: unknown, name: string): number | undefined => {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || value.trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0) {
      throw new AppError(`${name} must be a non-negative number.`, 400, 'INVALID_PRICE');
    }
    return Number(value);
  };
  const minPrice = parse(query.minPrice, 'minPrice');
  const maxPrice = parse(query.maxPrice, 'maxPrice');
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new AppError('minPrice must be less than or equal to maxPrice.', 400, 'INVALID_PRICE_RANGE');
  }
  return { minPrice, maxPrice };
}
