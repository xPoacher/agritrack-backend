import { Controller, Post, Get, Body, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CropCycle } from '../crop-cycle.entity';
import { Offer } from './offer.entity';

// Helper function to generate a 16-character WatermelonDB compatible ID
// This avoids needing to install external packages like nanoid or uuid
const generateWatermelonId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

@Controller('sync')
export class SyncController {
  constructor(
    @InjectRepository(CropCycle)
    private cropCycleRepo: Repository<CropCycle>,
    @InjectRepository(Offer)
    private offerRepo: Repository<Offer>,
  ) {}
  
  @Get('pull')
  async pullChanges(@Query('lastPulledAt') lastPulledAt: string, @Query('farmerId') farmerId: string) {
    let pendingOffers: Offer[] = [];
    
    // Fetch pending offers only if a farmerId is provided by the mobile app
    if (farmerId) {
      const farmerCrops = await this.cropCycleRepo.find({ where: { farmerId } });
      const cropIds = farmerCrops.map(c => c.id);

      if (cropIds.length > 0) {
        pendingOffers = await this.offerRepo.createQueryBuilder("offer")
          .where("offer.cropId IN (:...ids)", { ids: cropIds })
          .andWhere("offer.status = :status", { status: 'Pending' })
          .getMany();
      }
    }

    return {
      changes: { 
        crop_cycles: { created: [], updated: [], deleted: [] },
        offers: { created: pendingOffers, updated: [], deleted: [] }
      },
      timestamp: Date.now(),
    };
  }

  @Post('push')
  async pushChanges(@Body() body: any) {
    const { changes } = body;
    
    if (changes && changes.crop_cycles) {
      const { created } = changes.crop_cycles;
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

    // Process status updates to offers (Accepted, Rejected, Counter) pushed from the mobile app
    if (changes && changes.offers) {
      const { updated } = changes.offers;
      for (const updatedOffer of updated) {
        await this.offerRepo.update(updatedOffer.id, {
          status: updatedOffer.status,
          offeredPricePerKg: updatedOffer.offered_price_per_kg 
        });
      }
    }
    
    return { success: true };
  }

  @Get('marketplace')
  async getMarketplaceFeed(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    const allCrops = await this.cropCycleRepo.find();
    const allOffers = await this.offerRepo.find();
    
    const activeCrops = allCrops.filter(
      crop => (crop.quantityAvailable && crop.quantityAvailable > 0) || crop.harvestStatus === 'Planted'
    );

    const marketplaceFeed = activeCrops.map((crop) => {
      const allFarmerCrops = allCrops.filter(c => c.farmerId === crop.farmerId);
      
      const successful = allFarmerCrops.filter(c => c.harvestStatus === 'Harvested').length;
      const successRate = allFarmerCrops.length > 0 
        ? Math.round((successful / allFarmerCrops.length) * 100) 
        : 100;

      const typeOffers = allOffers.filter(o => {
        const linkedCrop = allCrops.find(c => c.id === o.cropId);
        return linkedCrop && linkedCrop.cropType === crop.cropType;
      });
      
      const avgPrice = typeOffers.length > 0 
        ? Math.round(typeOffers.reduce((sum, o) => sum + Number(o.offeredPricePerKg), 0) / typeOffers.length)
        : null;

      const batchOffers = allOffers.filter(o => o.cropId === crop.id);
      const topBid = batchOffers.length > 0 ? Math.max(...batchOffers.map(o => Number(o.offeredPricePerKg))) : null;

      return {
        ...crop,
        farmerName: crop.farmerId, 
        successRate: `${successRate}%`,
        marketAverage: avgPrice,
        topBid: topBid
      };
    });

    return marketplaceFeed;
  }

  @Post('offer')
  async submitOffer(@Body() body: any, @Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    const newOffer = this.offerRepo.create({
      id: generateWatermelonId(), // FIX: Explicitly assign the 16-character ID
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