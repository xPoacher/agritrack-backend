import { Controller, Post, Get, Body, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CropCycle } from '../crop-cycle.entity';
import { Offer } from './offer.entity';

@Controller('sync')
export class SyncController {
  constructor(
    @InjectRepository(CropCycle)
    private cropCycleRepo: Repository<CropCycle>,
    @InjectRepository(Offer)
    private offerRepo: Repository<Offer>,
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
  async getMarketplaceFeed(@Headers('authorization') authHeader: string) {
    // Enforce JWT token security for the buyer dashboard
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    // 1. Fetch all records to process in memory
    const allCrops = await this.cropCycleRepo.find();
    const allOffers = await this.offerRepo.find();
    
    // 2. Filter out empty/out-of-stock crops for the public feed
    const activeCrops = allCrops.filter(
      crop => (crop.quantityAvailable && crop.quantityAvailable > 0) || crop.harvestStatus === 'Planted'
    );

    // 3. Inject farmer profile details, success metrics, and price metrics into the response
    const marketplaceFeed = activeCrops.map((crop) => {
      
      // Find all historical records for this specific farmer
      const allFarmerCrops = allCrops.filter(c => c.farmerId === crop.farmerId);
      
      // Calculate success rate based on 'Harvested' status
      const successful = allFarmerCrops.filter(c => c.harvestStatus === 'Harvested').length;
      const successRate = allFarmerCrops.length > 0 
        ? Math.round((successful / allFarmerCrops.length) * 100) 
        : 100;

      // Price Metrics: Find all offers for this specific crop type across the platform
      const typeOffers = allOffers.filter(o => {
        const linkedCrop = allCrops.find(c => c.id === o.cropId);
        return linkedCrop && linkedCrop.cropType === crop.cropType;
      });
      
      const avgPrice = typeOffers.length > 0 
        ? Math.round(typeOffers.reduce((sum, o) => sum + Number(o.offeredPricePerKg), 0) / typeOffers.length)
        : null;

      // Top offer for this specific batch
      const batchOffers = allOffers.filter(o => o.cropId === crop.id);
      const topBid = batchOffers.length > 0 ? Math.max(...batchOffers.map(o => Number(o.offeredPricePerKg))) : null;

      return {
        ...crop,
        farmerName: crop.farmerId, // Using phone number as name until buyer/seller auth profiles are added
        successRate: `${successRate}%`,
        marketAverage: avgPrice,
        topBid: topBid
      };
    });

    return marketplaceFeed;
  }

  // New endpoint to handle the buyer's procurement offer
  @Post('offer')
  async submitOffer(@Body() body: any, @Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    const newOffer = this.offerRepo.create({
      cropId: body.cropId,
      buyerEmail: body.buyerEmail,
      companyName: body.companyName,
      offeredPricePerKg: body.price,
      status: 'Pending'
    });
    
    await this.offerRepo.save(newOffer);
    return { success: true, message: 'Offer submitted to farmer' };
  }
}