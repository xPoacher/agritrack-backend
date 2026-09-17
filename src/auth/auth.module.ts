import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: 'agritrack-super-secret-key-2026', // The key used to sign tokens
      signOptions: { expiresIn: '8h' }, // Token expires in 8 hours
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
