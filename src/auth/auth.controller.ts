import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    // Pass the companyName extracted from the frontend request body
    return this.authService.register(body.email, body.password, body.companyName);
  }

  @Post('verify')
  async verify(@Body() body: any) {
    return this.authService.verify(body.email, body.code);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }
}