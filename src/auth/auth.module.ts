import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Buyer } from './buyer.entity';

@Module({
  imports: [
    // Register the Buyer entity for this module
    TypeOrmModule.forFeature([Buyer]),
    
    // Configure JWT
    JwtModule.register({
      secret: 'agritrack-super-secret-key-2026', 
      signOptions: { expiresIn: '8h' }, 
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}