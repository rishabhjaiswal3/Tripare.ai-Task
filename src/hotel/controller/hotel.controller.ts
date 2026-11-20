import type { Request, Response } from 'express';
import { AppError } from '../../utils/app-error';
import { parsePriceRange } from '../../utils/price-query';
import { HotelService } from '../service/hotel.service';

export class HotelController {
  constructor(private readonly service: HotelService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
    if (!city || city.length > 80 || !/^[\p{L}\p{N} .'-]+$/u.test(city)) {
      throw new AppError('A valid city query parameter is required.', 400, 'INVALID_CITY');
    }
    const { minPrice, maxPrice } = parsePriceRange(req.query as Record<string, unknown>);
    res.json(await this.service.list(city.toLowerCase(), minPrice, maxPrice));
  };
}
