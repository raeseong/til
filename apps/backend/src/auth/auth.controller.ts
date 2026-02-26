import { Controller, Post, Body, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '성공 시 access_token 반환' })
  @ApiResponse({ status: 401, description: '비밀번호 불일치' })
  login(@Body() dto: LoginDto) {
    const token = this.auth.validateAndSign(dto.password);
    if (!token) throw new UnauthorizedException('Invalid password');
    return { access_token: token };
  }
}
