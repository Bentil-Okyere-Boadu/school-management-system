import { Admission } from './../admission/admission.entity';
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
import { Student } from 'src/student/student.entity';
import { ProfileService } from 'src/profile/profile.service';
import { Profile } from 'src/profile/profile.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { AdmissionService } from 'src/admission/admission.service';
import { Guardian } from 'src/admission/guardian.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { PreviousSchoolResult } from 'src/admission/previous-school-result.entity';
import { Parent } from 'src/parent/parent.entity';
import { InvitationService } from 'src/invitation/invitation.service';
import { AttendanceService } from 'src/attendance/attendance.service';
import { Attendance } from 'src/attendance/attendance.entity';
import { Holiday } from 'src/academic-calendar/entitites/holiday.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SchoolAdmin,
      Role,
      School,
      Student,
      Teacher,
      Profile,
      Admission,
      Guardian,
      ClassLevel,
      PreviousSchoolResult,
      Parent,
      Attendance,
      Holiday,
      AcademicTerm,
      AcademicCalendar,
    ]),
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
    ObjectStorageServiceService,
    AuthService,
    ProfileService,
    ConfigService,
    AdmissionService,
    InvitationService,
    AttendanceService,
  ],
  exports: [SchoolAdminAuthService, SchoolAdminService],
})
export class SchoolAdminModule {}
