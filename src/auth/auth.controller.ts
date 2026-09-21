import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(body.email, body.password, body.companyName);
  }

  // FIX: Renamed endpoint to match the React frontend exactly
  @Post('verify-registration')
  verifyRegistration(@Body() body: { email: string; code: string }) {
    return this.authService.verify(body.email, body.code);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  // FIX: Added the missing endpoint for the 2FA login verification
  @Post('verify-login')
  verifyLogin(@Body() body: { email: string; code: string }) {
    return this.authService.verifyLogin(body.email, body.code);
  }
}