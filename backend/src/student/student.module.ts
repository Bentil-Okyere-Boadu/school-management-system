import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './student.entity';
import { Role } from '../role/role.entity';
import { EmailModule } from '../common/modules/email.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StudentLocalStrategy } from './strategies/student-local.strategy';
import { StudentLocalAuthGuard } from './guards/student-local-auth.guard';
import { StudentAuthService } from './student.auth.service';
import { AuthService } from 'src/auth/auth.service';
import { StudentJwtStrategy } from './strategies/student-jwt.strategy';
import { InvitationService } from 'src/invitation/invitation.service';
import { School } from 'src/school/school.entity';
import { EmailService } from 'src/common/services/email.service';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Teacher } from 'src/teacher/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Role, School, SchoolAdmin, Teacher]),
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
  controllers: [StudentController],
  providers: [
    StudentService,
    AuthService,
    EmailService,
    InvitationService,
    StudentAuthService,
    StudentLocalStrategy,
    StudentLocalAuthGuard,
    StudentJwtStrategy,
  ],
  exports: [StudentService, StudentLocalAuthGuard],
})
export class StudentModule {}
