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
    // Configure standard Gmail SMTP for sending verification codes
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'YOUR_EMAIL@gmail.com', // Replace with your project email
        pass: 'YOUR_GMAIL_APP_PASSWORD', // Generate an App Password in your Google Account settings
      },
    });
  }

  // Notice the addition of companyName here
  async register(email: string, pass: string, companyName: string) {
    const existing = await this.buyerRepo.findOne({ where: { email } });
    if (existing) throw new BadRequestException('Email already registered');

    const hashedPassword = await bcrypt.hash(pass, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

    const buyer = this.buyerRepo.create({
      email,
      password: hashedPassword,
      companyName, // Save the company name to the database
      verificationCode,
    });
    await this.buyerRepo.save(buyer);

    // Send the email
    await this.transporter.sendMail({
      from: '"AgriTrack System" <noreply@agritrack.co.ke>',
      to: email,
      subject: 'Verify your AgriTrack Buyer Account',
      text: `Your verification code is: ${verificationCode}`,
    });

    return { message: 'Verification code sent to email' };
  }

  async verify(email: string, code: string) {
    const buyer = await this.buyerRepo.findOne({ where: { email } });
    if (!buyer || buyer.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    buyer.isVerified = true;
    buyer.verificationCode = ''; // Clear code after use
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

    // Embed the buyer's email and company name in the token payload
    const payload = { email: buyer.email, sub: buyer.id };
    return { 
      access_token: this.jwtService.sign(payload),
      companyName: buyer.companyName
    };
  }
}