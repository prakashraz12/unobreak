import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';
import { validateEnv, type Env } from './config/env.validation.js';
import { UserModule } from './modules/user/user.module.js';
import { AuthModule } from './modules/auth/auth.module.ts';
import { MatchModule } from './modules/match/match.module.ts';
import { GameSessionModule } from './modules/game-session/game-session.module.ts';
import { FriendModule } from './modules/friend/friend.module.ts';
import { RoomModule } from './modules/room/room.module.ts';
import { UploadModule } from './modules/upload/upload.module.ts';
import { HealthController } from './health.controller.ts';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        ssl: config.get('DATABASE_SSL') ? { rejectUnauthorized: true } : false,
        extra: { max: config.get('DATABASE_POOL_SIZE') },
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: config.get('NODE_ENV') === 'production',
        migrations: ['dist/database/migrations/*.js'],
        logging: config.get('DATABASE_LOGGING'),
      }),
    }),
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com,
    // then run `npx @nestjs/observe link` to write your key pair into .env.
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
    AuthModule,
    UserModule,
    MatchModule,
    GameSessionModule,
    FriendModule,
    RoomModule,
    UploadModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
