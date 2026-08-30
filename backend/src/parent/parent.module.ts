import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Parent } from './parent.entity';
import { ParentStudent } from './parent-student.entity';
import { Student } from '../student/student.entity';
import { ParentService } from './parent.service';
import { ParentController } from './parent.controller';
import { ParentAdminController } from './parent-admin.controller';
import { ParentLinkService } from './parent-link.service';
import { ParentAuthService } from './parent-auth.service';
import { ParentBackfillService } from './parent-backfill.service';
import { ParentAuthorizationService } from './parent.authorization';
import { ParentDashboardService } from './parent-dashboard.service';
import { ParentAttendanceService } from './parent-attendance.service';
import { ParentPaymentService } from './parent-payment.service';
import { ParentLocalStrategy } from './strategies/parent-local.strategy';
import { ParentJwtStrategy } from './strategies/parent-jwt.strategy';
import { Role } from 'src/role/role.entity';
import { School } from 'src/school/school.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { AuthService } from 'src/auth/auth.service';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { Attendance } from 'src/attendance/attendance.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { Holiday } from 'src/academic-calendar/entitites/holiday.entity';
import { AcademicCalendarService } from 'src/academic-calendar/academic-calendar.service';
import { PaymentsModule } from 'src/payments/payments.module';
import { SubjectModule } from 'src/subject/subject.module';
import { MessageReminder } from 'src/notification/entities/message-reminder.entity';
import { HubtelModule } from 'src/integrations/hubtel/hubtel.module';
import { StudentAnalyticsModule } from 'src/student-analytics/student-analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Parent,
      ParentStudent,
      Student,
      Role,
      School,
      SchoolAdmin,
      RefreshToken,
      Attendance,
      AcademicCalendar,
      AcademicTerm,
      Holiday,
      MessageReminder,
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
    NotificationModule,
    PaymentsModule,
    SubjectModule,
    HubtelModule,
    StudentAnalyticsModule,
  ],
  providers: [
    ParentService,
    ParentLinkService,
    ParentAuthService,
    ParentBackfillService,
    ParentAuthorizationService,
    ParentDashboardService,
    ParentAttendanceService,
    ParentPaymentService,
    ParentLocalStrategy,
    ParentJwtStrategy,
    AuthService,
    AcademicCalendarService,
  ],
  controllers: [ParentController, ParentAdminController],
  exports: [
    ParentService,
    ParentLinkService,
    ParentAuthorizationService,
    ParentAuthService,
  ],
})
export class ParentModule {}
