import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
      },
    });
  }

  async sendVerificationCode(to: string, code: string, isLogin: boolean = false) {
    const subject = isLogin ? 'AgriTrack Login Verification' : 'Verify your AgriTrack Account';
    const text = `Your verification code is: ${code}\n\nPlease enter this code to proceed.`;
    
    await this.transporter.sendMail({
      from: `"AgriTrack Security" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  }
}
