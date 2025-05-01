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

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, School]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
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
})
export class AuthModule {}
