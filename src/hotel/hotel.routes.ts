import { Router } from 'express';
import { HotelController } from './controller/hotel.controller';
import { asyncHandler } from '../utils/async-handler';

export function hotelRoutes(controller: HotelController): Router {
  const router = Router();
  router.get('/', asyncHandler(controller.list));
  return router;
}
