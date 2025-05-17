import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Role } from 'src/role/role.entity';
import { School } from 'src/school/school.entity';
import { EmailService } from 'src/common/services/email.service';
import { InvitationModule } from 'src/invitation/invitation.module';
import { UserModule } from '../user/user.module';
import { SchoolAdminModule } from '../school-admin/school-admin.module';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { StudentModule } from '../student/student.module';
import { StudentLocalStrategy } from './strategies/student-local.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, School]),
    UserModule,
    SchoolAdminModule,
    SuperAdminModule,
    StudentModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secret_key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES') || '1d',
        },
      }),
    }),
    ConfigModule,
    InvitationModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    ConfigService,
    EmailService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
