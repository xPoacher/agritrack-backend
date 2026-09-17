import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('procurement_offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  cropId!: string;

  @Column()
  buyerEmail!: string;
  
  @Column()
  companyName!: string;

  @Column('decimal')
  offeredPricePerKg!: number;

  @Column({ default: 'Pending' }) // Can be 'Pending', 'Accepted', 'Rejected'
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;
}