import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SuperAdminAuthService } from '../super-admin-auth.service';

@Injectable()
export class SuperAdminLocalStrategy extends PassportStrategy(
  Strategy,
  'super-admin-local',
) {
  constructor(private superAdminAuthService: SuperAdminAuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const superAdmin = await this.superAdminAuthService.validateSuperAdmin(
      email,
      password,
    );
    
    if (!superAdmin) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return superAdmin;
  }
} 