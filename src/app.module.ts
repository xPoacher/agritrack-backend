import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CropCycle } from './crop-cycle.entity';
import { SyncController } from './sync/sync.controller';
import { AuthModule } from './auth/auth.module';
import { Buyer } from './auth/buyer.entity';
import { Offer } from './sync/offer.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: 'postgresql://neondb_owner:npg_rmWGBv36XwxF@ep-curly-queen-b4ea7k4o-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
      ssl: true,
      extra: { ssl: { rejectUnauthorized: false } },
      entities: [CropCycle, Buyer, Offer],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([CropCycle, Offer]),
    AuthModule
  ],
  controllers: [SyncController],
})
export class AppModule {}