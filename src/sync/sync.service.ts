import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { CropCycle } from './entities/crop_cycle.entity'; // Adjust path if needed
import { Offer } from './offer.entity'; // Adjust path if needed

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(CropCycle)
    private cropCycleRepo: Repository<CropCycle>,
    @InjectRepository(Offer)
    private offerRepo: Repository<Offer>,
  ) {}

  async pullChanges(lastPulledAt: number) {
    const date = new Date(lastPulledAt || 0);
    
    // Fetch records created or updated since the last sync timestamp
    const createdCrops = await this.cropCycleRepo.find({ where: { created_at: MoreThan(date) } });
    const updatedCrops = await this.cropCycleRepo.find({ where: { updated_at: MoreThan(date) } });
    
    const createdOffers = await this.offerRepo.find({ where: { createdAt: MoreThan(date) } });
    
    return { 
      crop_cycles: { created: createdCrops, updated: updatedCrops, deleted: [] },
      // CRITICAL: Offers must be included here so the mobile app can download them
      offers: { created: createdOffers, updated: [], deleted: [] }
    };
  }

  async pushChanges(changes: any) {
    // Safely upsert local SQLite changes pushed from the mobile app
    if (changes.crop_cycles?.created?.length) {
      await this.cropCycleRepo.save(changes.crop_cycles.created);
    }
    if (changes.crop_cycles?.updated?.length) {
      await this.cropCycleRepo.save(changes.crop_cycles.updated);
    }

    // Safely upsert offer updates (e.g., when a farmer Accept/Rejects an offer offline)
    if (changes.offers?.created?.length) {
      await this.offerRepo.save(changes.offers.created);
    }
    if (changes.offers?.updated?.length) {
      await this.offerRepo.save(changes.offers.updated);
    }
  }
}