import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('crop_cycles')
export class CropCycle {
  @PrimaryColumn({ type: 'varchar', length: 20 })
id: string;

  @Column()
  cropType: string;

  @Column('float')
  expectedYield: number;

  @Column({ default: 'Planted' })
  harvestStatus: string;

  @Column('decimal', { default: 0 })
  quantityAvailable: number;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'bigint' })
  datePlanted: number;

  @Column({ nullable: true }) 
  farmerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}