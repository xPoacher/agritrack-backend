import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('offers') // Changed to match WatermelonDB schema
export class Offer {
  // Changed from UUID to accept WatermelonDB's 16-character string IDs
  @PrimaryColumn({ type: 'varchar', length: 20 })
  id!: string;

  @Column({ name: 'crop_id' })
  cropId!: string;

  @Column({ name: 'buyer_email' })
  buyerEmail!: string;
  
  @Column({ name: 'company_name' })
  companyName!: string;

  @Column('decimal', { name: 'offered_price_per_kg' })
  offeredPricePerKg!: number;

  @Column({ default: 'Pending' }) 
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}