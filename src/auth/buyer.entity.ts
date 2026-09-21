import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('buyers')
export class Buyer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;
  
  @Column()
  companyName!: string;

  // FIX: Added '| null' so TypeScript allows us to clear the code after login
  @Column({ type: 'varchar', nullable: true })
  verificationCode!: string | null;

  @Column({ default: false })
  isVerified!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}