import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../role/role.entity';
import { School } from '../school/school.entity';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { StudentModule } from 'src/student/student.module';
import { Student } from 'src/student/student.entity';
import { SchoolAdminService } from 'src/school-admin/school-admin.service';
import { Profile } from 'src/profile/profile.entity';
import { ProfileService } from 'src/profile/profile.service';
import { SchoolAdminAuthService } from 'src/school-admin/school-admin-auth.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { Teacher } from 'src/teacher/teacher.entity';
import { TeacherService } from 'src/teacher/teacher.service';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { AttendanceService } from 'src/attendance/attendance.service';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { Attendance } from 'src/attendance/attendance.entity';
import { Holiday } from 'src/academic-calendar/entitites/holiday.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { AcademicCalendarService } from 'src/academic-calendar/academic-calendar.service';
import { Assignment } from 'src/teacher/entities/assignment.entity';
import { AssignmentSubmission } from 'src/student/entities/assignment-submission.entity';
import { Subject } from 'rxjs';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { ParentModule } from 'src/parent/parent.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      School,
      SchoolAdmin,
      Student,
      Profile,
      Teacher,
      ClassLevel,
      Attendance,
      Holiday,
      AcademicCalendar,
      AcademicTerm,
      Assignment,
      AssignmentSubmission,
      Subject,
      RefreshToken,
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
    StudentModule,
    ParentModule,
    NotificationModule,
  ],
  providers: [
    InvitationService,
    TeacherService,
    SchoolAdminService,
    ObjectStorageServiceService,
    ProfileService,
    SchoolAdminAuthService,
    AttendanceService,
    AuthService,
    AcademicCalendarService,
  ],
  controllers: [InvitationController],
  exports: [InvitationService],
})
export class InvitationModule {}
