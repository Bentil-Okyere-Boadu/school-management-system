import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { SchoolModule } from './school/school.module';
import { CommonModule } from './common/common.module';
import { FeeStructureModule } from './fee-structure/fee-structure.module';
import { GradingSystemModule } from './grading-system/grading-system.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
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
      synchronize: true,
      // ssl: {
      //   rejectUnauthorized : false,
      // },
      //logging: true,
    }),
    CommonModule,
    RoleModule,
    PermissionModule,
    AuthModule,
    SchoolModule,
    FeeStructureModule,
    GradingSystemModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
