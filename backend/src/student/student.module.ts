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
import { Profile } from 'src/profile/profile.entity';
import { ProfileService } from 'src/profile/profile.service';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { Parent } from 'src/parent/parent.entity';
import { ParentService } from 'src/parent/parent.service';
import { AttendanceService } from 'src/attendance/attendance.service';
import { Attendance } from 'src/attendance/attendance.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { Holiday } from 'src/academic-calendar/entitites/holiday.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';
import { AcademicCalendarService } from 'src/academic-calendar/academic-calendar.service';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { Assignment } from 'src/teacher/entities/assignment.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Role,
      School,
      SchoolAdmin,
      Teacher,
      Profile,
      Parent,
      Attendance,
      ClassLevel,
      Holiday,
      AcademicTerm,
      AcademicCalendar,
      AssignmentSubmission,
      Assignment,
      RefreshToken,
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
  controllers: [StudentController],
  providers: [
    StudentService,
    AuthService,
    EmailService,
    ProfileService,
    InvitationService,
    ObjectStorageServiceService,
    ParentService,
    StudentAuthService,
    StudentLocalStrategy,
    StudentLocalAuthGuard,
    StudentJwtStrategy,
    AttendanceService,
    AcademicCalendarService,
  ],
  exports: [StudentService, StudentLocalAuthGuard],
})
export class StudentModule {}
