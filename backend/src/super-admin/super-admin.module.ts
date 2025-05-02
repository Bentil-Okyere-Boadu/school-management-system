import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdmin } from './super-admin.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { PassportModule } from '@nestjs/passport';
import { SuperAdminAuthController } from './super-admin-auth.controller';
import { SuperAdminJwtStrategy } from './strategies/super-admin-jwt.strategy';
import { AuthService } from '../auth/services/auth.service';
import { Role } from '../role/role.entity';
import { SuperAdminLocalStrategy } from './strategies/super-admin-local.strategy';
import { RoleService } from '../role/role.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SuperAdmin, Role]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [
    SuperAdminService,
    SuperAdminAuthService,
    SuperAdminJwtStrategy,
    SuperAdminLocalStrategy,
    AuthService,
    RoleService,
  ],
  controllers: [SuperAdminController, SuperAdminAuthController],
  exports: [SuperAdminService, SuperAdminAuthService],
})
export class SuperAdminModule {}
