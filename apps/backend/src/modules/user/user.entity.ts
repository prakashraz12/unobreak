import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entity/base.entity.ts';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', unique: true })
  userId: number;

  @Column({ type: 'int' })
  avatarId: number;

  @Column({ type: 'jsonb' })
  activity: {
    isOnline: boolean;
    lastActive: Date;
  };

  @Column({ type: 'jsonb' })
  geoData: {
    country: string;
    countryCode: string;
    city: string;
  };

  @Column({ type: 'jsonb' })
  stats: {
    totalMatches: number;
    totalWins: number;
    totalLosses: number;
  };

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  googleId: string | null;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'text', nullable: true })
  customProfileImage: string | null;

  @Column({ type: 'varchar', length: 6, nullable: true })
  otp: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  otpExpiresAt: Date | null;
}
