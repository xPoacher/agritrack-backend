import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CropCycle } from './crop-cycle.entity';
import { SyncController } from './sync/sync.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
     type: 'postgres',
    url: 'postgresql://neondb_owner:npg_rmWGBv36XwxF@ep-curly-queen-b4ea7k4o-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: true,
    extra: { ssl: { rejectUnauthorized: false } },
    entities: [CropCycle],
    synchronize: true,
    }),
    TypeOrmModule.forFeature([CropCycle])
  ],
  controllers: [SyncController],
})
export class AppModule {}