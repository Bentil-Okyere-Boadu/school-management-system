import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { SchoolAdminController } from './school-admin.controller';
import { SchoolAdminAuthService } from './school-admin-auth.service';
import { SchoolAdminService } from './school-admin.service';
import { SchoolAdmin } from './school-admin.entity';
import { School } from '../school/school.entity';
import { EmailModule } from '../common/modules/email.module';
import { SchoolAdminLocalStrategy } from './strategies/school-admin-local.strategy';
import { SchoolAdminJwtStrategy } from './strategies/school-admin-jwt.strategy';
import { AuthService } from 'src/auth/auth.service';
import { Role } from 'src/role/role.entity';
import { User } from 'src/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SchoolAdmin, Role, School, User]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    EmailModule,
  ],
  controllers: [SchoolAdminController],
  providers: [
    SchoolAdminAuthService,
    SchoolAdminService,
    SchoolAdminLocalStrategy,
    SchoolAdminJwtStrategy,
    AuthService,
    ConfigService,
  ],
  exports: [SchoolAdminAuthService, SchoolAdminService],
})
export class SchoolAdminModule {}
