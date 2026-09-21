import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Buyer } from './buyer.entity';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Buyer)
    private buyerRepo: Repository<Buyer>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  // Helper function to generate a 6-digit code
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 1. Initial Registration
  async register(email: string, pass: string, companyName: string) {
    const existingBuyer = await this.buyerRepo.findOne({ where: { email } });
    if (existingBuyer) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const code = this.generateCode();

    const newBuyer = this.buyerRepo.create({
      email,
      password: hashedPassword,
      companyName,
      verificationCode: code,
      isVerified: false, 
    });

    await this.buyerRepo.save(newBuyer);
    
    // Wrapped in try/catch to prevent server crashes if the email fails
    try {
      await this.emailService.sendVerificationCode(email, code, false);
    } catch (error) {
      console.error("CRITICAL EMAIL ERROR (Registration):", error);
    }

    return { message: 'Registration successful, verification code sent.' };
  }

  // 2. Verify Registration Code
  async verify(email: string, code: string) {
    const buyer = await this.buyerRepo.findOne({ where: { email } });
    if (!buyer) throw new UnauthorizedException('User not found');
    if (buyer.verificationCode !== code) throw new BadRequestException('Invalid verification code');

    buyer.isVerified = true;
    buyer.verificationCode = null; // Clear code after successful use
    await this.buyerRepo.save(buyer);

    return { message: 'Account verified successfully. Please login.' };
  }

  // 3. Initial Login (Checks password, sends new 2FA code)
  async login(email: string, pass: string) {
    const buyer = await this.buyerRepo.findOne({ where: { email } });
    if (!buyer) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(pass, buyer.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (!buyer.isVerified) {
      throw new UnauthorizedException('Account not verified. Please verify your email first.');
    }

    // Generate new 2FA code specifically for this login session
    const code = this.generateCode();
    buyer.verificationCode = code;
    await this.buyerRepo.save(buyer);

    // Wrapped in try/catch to prevent server crashes if the email fails
    try {
      await this.emailService.sendVerificationCode(email, code, true);
    } catch (error) {
      console.error("CRITICAL EMAIL ERROR (Login):", error);
    }

    // Tell frontend to show the verify-login screen
    return { message: 'Login credentials valid. Verification code sent to email.', requires2FA: true };
  }

  // 4. Verify Login Code (Issues JWT Token)
  async verifyLogin(email: string, code: string) {
    const buyer = await this.buyerRepo.findOne({ where: { email } });
    if (!buyer) throw new UnauthorizedException('User not found');
    if (buyer.verificationCode !== code) throw new UnauthorizedException('Invalid login code');

    // Clear code so it cannot be reused
    buyer.verificationCode = null;
    await this.buyerRepo.save(buyer);

    // Issue JWT Token
    const payload = { email: buyer.email, sub: buyer.id };
    const access_token = this.jwtService.sign(payload);

    return { 
      access_token,
      companyName: buyer.companyName
    };
  }
}