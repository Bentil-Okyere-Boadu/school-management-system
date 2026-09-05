import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { SchoolModule } from './school/school.module';
import { CommonModule } from './common/common.module';
import { FeeStructureModule } from './fee-structure/fee-structure.module';
import { GradingSystemModule } from './grading-system/grading-system.module';
import { GradingSchemeModule } from './grading-scheme/grading-scheme.module';
import { AdmissionPolicyModule } from './admission-policy/admission-policy.module';
import { InvitationModule } from './invitation/invitation.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { SchoolAdminModule } from './school-admin/school-admin.module';
import { ClassLevelModule } from './class-level/class-level.module';
import { AcademicCalendarModule } from './academic-calendar/academic-calendar.module';
import { ProfileModule } from './profile/profile.module';
import { StudentModule } from './student/student.module';
import { TeacherModule } from './teacher/teacher.module';
import { ObjectStorageServiceModule } from './object-storage-service/object-storage-service.module';
import { ParentModule } from './parent/parent.module';
import { AdmissionModule } from './admission/admission.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SubjectModule } from './subject/subject.module';
import { NotificationModule } from './notification/notification.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CurriculumModule } from './curriculum/curriculum.module';
import { PlannerModule } from './planner/planner.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PaymentsModule } from './payments/payments.module';
import { HubtelModule } from './integrations/hubtel/hubtel.module';
import { StudentAnalyticsModule } from './student-analytics/student-analytics.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: (configService.get<number>('THROTTLE_TTL') || 60) * 1000, // Time window in milliseconds
            limit: configService.get<number>('THROTTLE_LIMIT') || 100, // Max requests per window
          },
        ],
      }),
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity.{ts,js}'],
      migrations: [__dirname + '/migrations/*.{ts,js}'],
      migrationsRun: true,
      synchronize: false,
      // ssl: {
      //   rejectUnauthorized : false,
      // },
      logging: false,
    }),
    CommonModule,
    TenantModule,
    RoleModule,
    PermissionModule,
    AuthModule,
    SchoolModule,
    FeeStructureModule,
    GradingSystemModule,
    GradingSchemeModule,
    AdmissionPolicyModule,
    InvitationModule,
    SuperAdminModule,
    SchoolAdminModule,
    ClassLevelModule,
    AcademicCalendarModule,
    ProfileModule,
    StudentModule,
    TeacherModule,
    ObjectStorageServiceModule,
    ParentModule,
    AdmissionModule,
    AttendanceModule,
    SubjectModule,
    NotificationModule,
    CurriculumModule,
    PlannerModule,
    PaymentsModule,
    HubtelModule,
    StudentAnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
