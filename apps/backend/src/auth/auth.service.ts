import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
  ) {}

  validateAndSign(password: string): string | null {
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD') || 'admin123';
    if (password !== adminPassword) return null;
    return this.jwt.sign({ sub: 'admin', role: 'admin' });
  }

  validatePayload(payload: { sub: string; role: string }): boolean {
    return payload?.role === 'admin';
  }
}
