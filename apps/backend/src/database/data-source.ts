import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { envSchema } from '../config/env.validation.js';

const env = envSchema.parse(process.env);

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : false,
  extra: { max: env.DATABASE_POOL_SIZE },
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: env.DATABASE_LOGGING,
});
