import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('crop_cycles')
export class CropCycle {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column()
  crop_type: string;

  @Column('int')
  expected_yield: number;

  @Column({ default: 'Planted' })
  harvest_status: string;

  @Column({ type: 'bigint', nullable: true })
  date_planted: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}