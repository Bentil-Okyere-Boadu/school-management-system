import { Module } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from './teacher.entity';
import { Role } from '../role/role.entity';
import { AuthService } from 'src/auth/auth.service';
import { TeacherAuthService } from './teacher.auth.service';
import { TeacherLocalStrategy } from './strategies/teacher-local.strategy';
import { TeacherLocalAuthGuard } from './guards/teacher-local-auth.guard';
import { TeacherJwtStrategy } from './strategies/teacher-jwt.strategy';
import { TeacherJwtAuthGuard } from './guards/teacher-jwt-auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '../common/modules/email.module';
import { InvitationService } from 'src/invitation/invitation.service';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { EmailService } from 'src/common/services/email.service';
import { Student } from 'src/student/student.entity';
import { School } from 'src/school/school.entity';
import { Profile } from 'src/profile/profile.entity';
import { ProfileService } from 'src/profile/profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher,
      Role,
      SchoolAdmin,
      Student,
      School,
      Profile,
    ]),
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secret_key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES') || '1d',
        },
      }),
    }),
  ],
  providers: [
    TeacherService,
    AuthService,
    EmailService,
    ProfileService,
    TeacherAuthService,
    InvitationService,
    TeacherLocalStrategy,
    TeacherLocalAuthGuard,
    TeacherJwtStrategy,
    TeacherJwtAuthGuard,
  ],
  controllers: [TeacherController],
  exports: [TeacherService, TeacherAuthService, TeacherJwtAuthGuard],
})
export class TeacherModule {}
