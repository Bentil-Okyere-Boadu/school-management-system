import { Super } from './../../../../frontend/node_modules/@types/estree/index.d';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SuperAdmin } from 'src/super-admin/super-admin.entity';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  generateToken(payload: { [key: string]: string }): string {
    return this.jwtService.sign(payload);
  }

  createAuthResponse(entity: SuperAdmin) {
    const payload = {
      email: entity.email,
      sub: entity.id,

      role: entity.role?.name,
    };

    return {
      access_token: this.generateToken(payload),
      ...entity,
    };
  }
}
