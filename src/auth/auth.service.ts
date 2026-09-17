import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Buyer } from './buyer.entity';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private transporter;

  constructor(
    @InjectRepository(Buyer)
    private buyerRepo: Repository<Buyer>,
    private jwtService: JwtService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'agritrack.system.mail@gmail.com', 
        pass: 'zqhrfqwsjlabdpiw',
      },
    });
  }

  async register(email: string, pass: string, companyName: string) {
    const existing = await this.buyerRepo.findOne({ where: { email } });
    if (existing) throw new BadRequestException('Email already registered');

    const hashedPassword = await bcrypt.hash(pass, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); 

    const buyer = this.buyerRepo.create({
      email,
      password: hashedPassword,
      companyName,
      verificationCode,
    });
    await this.buyerRepo.save(buyer);

    // CRITICAL: Print code to Render logs so you can test without emails working
    console.log(`\n\n======================================================`);
    console.log(`=== VERIFICATION CODE FOR ${email}: ${verificationCode} ===`);
    console.log(`======================================================\n\n`);

    try {
      await this.transporter.sendMail({
        from: '"AgriTrack System" <noreply@agritrack.co.ke>',
        to: email,
        subject: 'Verify your AgriTrack Buyer Account',
        text: `Your verification code is: ${verificationCode}`,
      });
    } catch (error) {
      // Cast the unknown error to standard Error type to safely read the message
      const emailError = error as Error;
      console.error('Email failed to send (check Gmail App Password), but registration succeeded:', emailError.message);
    }

    return { message: 'Verification code generated successfully' };
  }

  async verify(email: string, code: string) {
    const buyer = await this.buyerRepo.findOne({ where: { email } });
    if (!buyer || buyer.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    buyer.isVerified = true;
    buyer.verificationCode = ''; 
    await this.buyerRepo.save(buyer);
    return { message: 'Account verified successfully' };
  }

  async login(email: string, pass: string) {
    const buyer = await this.buyerRepo.findOne({ where: { email } });
    
    if (!buyer || !(await bcrypt.compare(pass, buyer.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!buyer.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const payload = { email: buyer.email, sub: buyer.id };
    return { 
      access_token: this.jwtService.sign(payload),
      companyName: buyer.companyName
    };
  }
}