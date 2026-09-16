import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { CropCycle } from './entities/crop_cycle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CropCycle])],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}