import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly auth: AuthService) {
    super();
  }

  handleRequest<T>(err: Error | null, payload: T | false): T {
    if (err || !payload) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    const p = payload as unknown as { sub: string; role: string };
    if (!this.auth.validatePayload(p)) {
      throw new UnauthorizedException('Invalid token');
    }
    return payload;
  }
}
