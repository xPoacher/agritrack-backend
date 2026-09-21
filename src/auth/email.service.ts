import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    // Explicitly configure the host and port to prevent cloud timeouts
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // This helps bypass some strict server network restrictions
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendVerificationCode(email: string, code: string, isLogin: boolean) {
    const subject = isLogin ? 'Your AgriTrack Login Code' : 'Verify Your AgriTrack Account';
    const text = `Your 6-digit security code is: ${code}\n\nPlease enter this code in the AgriTrack portal to continue.`;

    await this.transporter.sendMail({
      from: `"AgriTrack Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
    });
  }
}