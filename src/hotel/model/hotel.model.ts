import { config } from '../../config/env';
import { connectRedis, redis } from '../../config/redis';
import type { HotelOffer } from '../../types';

export class HotelModel {
  private key(city: string): string { return `hotels:${city.toLowerCase()}`; }

  async exists(city: string): Promise<boolean> {
    await connectRedis();
    return (await redis.exists(`${this.key(city)}:cached`)) === 1;
  }

  async saveAll(city: string, offers: HotelOffer[]): Promise<void> {
    await connectRedis();
    const key = this.key(city);
    const pipeline = redis.pipeline().del(key);
    offers.forEach((offer) => pipeline.zadd(key, offer.price, JSON.stringify(offer)));
    pipeline.expire(key, config.cacheTtlSeconds);
    pipeline.set(`${key}:cached`, '1', 'EX', config.cacheTtlSeconds);
    const results = await pipeline.exec();
    const error = results?.find(([err]) => err)?.[0];
    if (error) throw error;
  }

  async findByPrice(city: string, minPrice?: number, maxPrice?: number): Promise<HotelOffer[]> {
    await connectRedis();
    const values = await redis.zrangebyscore(this.key(city), minPrice ?? '-inf', maxPrice ?? '+inf');
    return values.map((value) => JSON.parse(value) as HotelOffer);
  }
}
