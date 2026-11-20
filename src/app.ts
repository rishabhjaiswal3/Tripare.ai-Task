import express from 'express';
import helmet from 'helmet';
import { HotelController } from './hotel/controller/hotel.controller';
import { SupplierController } from './hotel/controller/supplier.controller';
import { HotelModel } from './hotel/model/hotel.model';
import { SupplierModel } from './hotel/model/supplier.model';
import { HotelService } from './hotel/service/hotel.service';
import { TemporalModel } from './temporal/temporal.model';
import { errorHandler } from './middleware/error-handler';
import { apiLimiter } from './middleware/security';
import { hotelRoutes } from './hotel/hotel.routes';
import { requestLogger } from './utils/request-logger';

export function createApp() {
  const app = express();
  const cache = new HotelModel();
  const temporal = new TemporalModel();
  const suppliers = new SupplierModel();

  const hotelController = new HotelController(new HotelService(cache, temporal));
  const supplierController = new SupplierController();

  app.disable('x-powered-by');
  // Render is behind one trusted reverse proxy; express-rate-limit uses this
  // setting to derive the client IP from X-Forwarded-For.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(requestLogger);
  app.use(express.json({ limit: '10kb', strict: true }));
  app.use('/api', apiLimiter);
  app.use('/api/hotels', hotelRoutes(hotelController));
  app.get('/supplierA/hotels', supplierController.listA);
  app.get('/supplierB/hotels', supplierController.listB);
  app.use(errorHandler);
  return app;
}
