import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; // Added ConfigModule import
import { CropCycle } from './crop-cycle.entity';
import { SyncController } from './sync/sync.controller';
import { AuthModule } from './auth/auth.module';
import { Buyer } from './auth/buyer.entity';
import { Offer } from './sync/offer.entity';

@Module({
  imports: [
    ConfigModule.forRoot(), // Loads the .env file into your application
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // Securely reads the URL from the environment
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