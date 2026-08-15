import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ParentAuthService } from '../parent-auth.service';

@Injectable()
export class ParentLocalStrategy extends PassportStrategy(
  Strategy,
  'parent-local',
) {
  constructor(private parentAuthService: ParentAuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const parent = await this.parentAuthService.validateParent(email, password);
    if (!parent) {
      await this.parentAuthService.assertNotSuspended(email);
      throw new UnauthorizedException('Invalid credentials');
    }
    return parent;
  }
}
