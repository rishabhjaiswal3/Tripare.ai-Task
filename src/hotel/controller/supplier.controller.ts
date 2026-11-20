import type { Request, Response } from 'express';
import { hotelsFromSupplier } from '../../mock-data';

export class SupplierController {
  listA = (req: Request, res: Response): void => { res.json(hotelsFromSupplier('A', this.city(req))); };
  listB = (req: Request, res: Response): void => { res.json(hotelsFromSupplier('B', this.city(req))); };

  private city(req: Request): string { return typeof req.query.city === 'string' ? req.query.city : ''; }
}
