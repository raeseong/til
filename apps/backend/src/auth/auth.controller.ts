import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    const token = this.auth.validateAndSign(dto.password);
    if (!token) throw new UnauthorizedException('Invalid password');
    return { access_token: token };
  }
}
