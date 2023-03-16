/*
https://docs.nestjs.com/providers#services
*/

import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get(key: string) {
    return this.cacheManager.get(key);
  }

  async set(key: string, data: any, expired: number) {
    return this.cacheManager.set(key, data, { ttl: expired });
  }

  async del(key: string) {
    return this.cacheManager.del(key);
  }
}
