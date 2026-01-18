import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Role } from 'src/role/role.entity';
import { School } from 'src/school/school.entity';
import { EmailService } from 'src/common/services/email.service';
import { InvitationModule } from 'src/invitation/invitation.module';
import { SchoolAdminModule } from '../school-admin/school-admin.module';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { StudentModule } from '../student/student.module';
import { TeacherModule } from '../teacher/teacher.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Student } from '../student/student.entity';
import { SuperAdmin } from '../super-admin/super-admin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      School,
      RefreshToken,
      SchoolAdmin,
      Teacher,
      Student,
      SuperAdmin,
    ]),
    SchoolAdminModule,
    SuperAdminModule,
    StudentModule,
    TeacherModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secret_key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES') || '15m', // Short-lived access tokens
        },
      }),
    }),
    ConfigModule,
    InvitationModule,
  ],
  providers: [AuthService, ConfigService, EmailService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
