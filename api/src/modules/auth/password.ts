import argon2 from 'argon2';
import type { AppConfig } from '../../config/env.js';

export class PasswordService {
  private readonly memoryCost: number;
  private readonly timeCost: number;
  private readonly parallelism: number;

  constructor(config: AppConfig) {
    this.memoryCost = config.auth.argon2MemoryCostKib;
    this.timeCost = config.auth.argon2TimeCost;
    this.parallelism = config.auth.argon2Parallelism;
  }

  public async hashPassword(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, {
      type: argon2.argon2id,
      memoryCost: this.memoryCost,
      timeCost: this.timeCost,
      parallelism: this.parallelism,
    });
  }

  public async verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
    if (!hash || !plainPassword) {
      return false;
    }

    try {
      return await argon2.verify(hash, plainPassword);
    } catch {
      return false;
    }
  }
}
