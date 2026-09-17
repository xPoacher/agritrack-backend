import { Controller, Post, Get, Body, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CropCycle } from '../crop-cycle.entity';
import { Offer } from './offer.entity';

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
    // FIX: Added explicit ': any[]' types to satisfy TypeScript strict mode
    let formattedCrops: any[] = [];
    let formattedOffers: any[] = [];
    
    if (farmerId) {
      // 1. Fetch crops and format them exactly how WatermelonDB expects (snake_case)
      const farmerCrops = await this.cropCycleRepo.find({ where: { farmerId } });
      formattedCrops = farmerCrops.map(c => ({
        id: c.id,
        crop_type: c.cropType,
        expected_yield: c.expectedYield,
        quantity_available: c.quantityAvailable,
        location: c.location,
        harvest_status: c.harvestStatus,
        date_planted: c.datePlanted,
        farmer_id: c.farmerId,
      }));

      const cropIds = farmerCrops.map(c => c.id);
      if (cropIds.length > 0) {
        // 2. Fetch offers and format them
        const allFarmerOffers = await this.offerRepo.createQueryBuilder("offer")
          .where("offer.cropId IN (:...ids)", { ids: cropIds })
          .getMany();
          
        formattedOffers = allFarmerOffers.map(o => ({
          id: o.id,
          crop_id: o.cropId,
          buyer_email: o.buyerEmail,
          company_name: o.companyName,
          offered_price_per_kg: o.offeredPricePerKg,
          status: o.status,
        }));
      }
    }

    return {
      changes: { 
        crop_cycles: { created: formattedCrops, updated: [], deleted: [] },
        offers: { created: formattedOffers, updated: [], deleted: [] }
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) return;
    const allCrops = await this.cropCycleRepo.find();
    const allOffers = await this.offerRepo.find();
    
    const activeCrops = allCrops.filter(
      crop => (crop.quantityAvailable && crop.quantityAvailable > 0) || crop.harvestStatus === 'Planted'
    );

    return activeCrops.map((crop) => {
      const allFarmerCrops = allCrops.filter(c => c.farmerId === crop.farmerId);
      const successful = allFarmerCrops.filter(c => c.harvestStatus === 'Harvested').length;
      const successRate = allFarmerCrops.length > 0 ? Math.round((successful / allFarmerCrops.length) * 100) : 100;
      const batchOffers = allOffers.filter(o => o.cropId === crop.id);
      const topBid = batchOffers.length > 0 ? Math.max(...batchOffers.map(o => Number(o.offeredPricePerKg))) : null;

      return { ...crop, farmerName: crop.farmerId, successRate: `${successRate}%`, topBid: topBid };
    });
  }

  @Post('offer')
  async submitOffer(@Body() body: any, @Headers('authorization') authHeader: string) {
    const newOffer = this.offerRepo.create({
      id: generateWatermelonId(),
      cropId: body.cropId,
      buyerEmail: body.buyerEmail,
      companyName: body.companyName,
      offeredPricePerKg: body.price,
      status: 'Pending'
    });
    await this.offerRepo.save(newOffer);
    return { success: true };
  }

  @Post('offer/respond')
  async respondToCounter(@Body() body: { offerId: string, status: string }, @Headers('authorization') authHeader: string) {
    await this.offerRepo.update(body.offerId, { status: body.status });
    return { success: true };
  }

  @Get('buyer/dashboard')
  async getBuyerDashboard(@Query('email') email: string, @Headers('authorization') authHeader: string) {
    if (!email) return []; 
    
    const myOffers = await this.offerRepo.find({ where: { buyerEmail: email } });
    const allCrops = await this.cropCycleRepo.find();

    return myOffers.map(offer => {
      const relatedCrop = allCrops.find(c => c.id === offer.cropId);
      return {
        ...offer,
        cropType: relatedCrop ? relatedCrop.cropType : 'Unknown Crop',
        farmerContact: relatedCrop ? relatedCrop.farmerId : 'Unknown Farmer',
        location: relatedCrop ? relatedCrop.location : 'Unknown Location',
      };
    });
  }
}