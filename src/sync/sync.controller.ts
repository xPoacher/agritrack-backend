import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CropCycle } from '../crop-cycle.entity';

@Controller('sync')
export class SyncController {
  constructor(
    @InjectRepository(CropCycle)
    private cropCycleRepo: Repository<CropCycle>,
  ) {}

  @Get('pull')
  async pullChanges(@Query('lastPulledAt') lastPulledAt: string) {
    // A simplified pull response for early prototyping
    return {
      changes: { crop_cycles: { created: [], updated: [], deleted: [] } },
      timestamp: Date.now(),
    };
  }

  @Post('push')
  async pushChanges(@Body() body: any) {
    const { changes } = body;
    
    if (changes && changes.crop_cycles) {
      const { created } = changes.crop_cycles;
      
      // Loop through offline records and insert them into PostgreSQL
      for (const crop of created) {
        const newCrop = this.cropCycleRepo.create({
          id: crop.id,
          cropType: crop.crop_type,
          expectedYield: crop.expected_yield,
          quantityAvailable: crop.quantity_available, 
          location: crop.location,
          harvestStatus: crop.harvest_status,
          datePlanted: crop.date_planted,
          farmerId: crop.farmer_id,
        });
        await this.cropCycleRepo.save(newCrop);
      }
    }
    return { success: true };
  }

  @Get('marketplace')
  async getMarketplaceFeed() {
    // Retrieves all records from the crop_cycle table
    return this.cropCycleRepo.find();
  }
}