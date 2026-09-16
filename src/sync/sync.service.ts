import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { CropCycle } from './entities/crop_cycle.entity';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(CropCycle)
    private cropCycleRepo: Repository<CropCycle>,
  ) {}

  async pullChanges(lastPulledAt: number) {
    const date = new Date(lastPulledAt || 0);
    // Fetch records created or updated since the last sync timestamp
    const created = await this.cropCycleRepo.find({ where: { created_at: MoreThan(date) } });
    const updated = await this.cropCycleRepo.find({ where: { updated_at: MoreThan(date) } });
    
    return { crop_cycles: { created, updated, deleted: [] } };
  }

  async pushChanges(changes: any) {
    // Safely upsert local SQLite changes pushed from the mobile app
    if (changes.crop_cycles?.created?.length) {
      await this.cropCycleRepo.save(changes.crop_cycles.created);
    }
    if (changes.crop_cycles?.updated?.length) {
      await this.cropCycleRepo.save(changes.crop_cycles.updated);
    }
  }
}