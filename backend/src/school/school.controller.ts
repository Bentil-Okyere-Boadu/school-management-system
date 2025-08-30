import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SchoolService } from './school.service';
import { School } from './school.entity';
import { RolesGuard } from 'src/auth/roles.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateCalendlyUrlDto } from './dto/update-calendly-url.dto';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SuperAdminJwtAuthGuard } from 'src/super-admin/guards/super-admin-jwt-auth.guard';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { DeepSanitizeResponseInterceptor } from 'src/common/interceptors/deep-sanitize-response.interceptor';
import { InjectRepository } from '@nestjs/typeorm';
import { Teacher } from 'src/teacher/teacher.entity';
import { Student } from 'src/student/student.entity';
import { Repository } from 'typeorm';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';

@Controller('schools')
export class SchoolController {
  constructor(
    private readonly schoolService: SchoolService,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    private readonly objectStorageService: ObjectStorageServiceService,
  ) {}

  /**
   * Create a new school
   * School admins can create one school and will be associated with it
   */
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('/create')
  @Roles('school_admin')
  create(
    @Body() createSchoolDto: CreateSchoolDto,
    @CurrentUser() user: SchoolAdmin,
  ): Promise<School> {
    return this.schoolService.create(createSchoolDto, user);
  }

  /**
   * Get all schools (super admin only)
   */
  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get()
  @Roles('super_admin')
  findAll(): Promise<School[]> {
    return this.schoolService.findAll();
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('dashboard')
  async getDashboardData() {
    const [totalSchools, totalTeachers, totalStudents] = await Promise.all([
      this.schoolRepository.count(),
      this.teacherRepository.count(),
      this.studentRepository.count(),
    ]);

    // Mock attendance for now
    const averageAttendanceRate = 82; // or fetch if you have a service

    // Mock performance data for now
    const performance = [
      {
        schoolName: 'Bay Christian Int. School',
        topPerforming: 52,
        lowPerforming: 18,
      },
      {
        schoolName: 'William Paden Elementary School',
        topPerforming: 70,
        lowPerforming: 30,
      },
      {
        schoolName: 'Jefferson Elementary School',
        topPerforming: 42,
        lowPerforming: 10,
      },
      {
        schoolName: 'Emerson Elementary School',
        topPerforming: 85,
        lowPerforming: 5,
      },
      {
        schoolName: 'King Child Development Center',
        topPerforming: 92,
        lowPerforming: 50,
      },
    ];

    return {
      totalSchools,
      totalTeachers,
      totalStudents,
      averageAttendanceRate,
      performance,
    };
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete('logo')
  @Roles('school_admin')
  async deleteLogo(@CurrentUser() user: SchoolAdmin) {
    const school = await this.schoolService.deleteLogo(user.school.id);

    return {
      message: 'School logo deleted successfully',
      school,
    };
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':id')
  @Roles('super_admin')
  @UseInterceptors(DeepSanitizeResponseInterceptor)
  findOne(@Param('id') id: string): Promise<School> {
    return this.schoolService.findOneWithDetails(id);
  }

  /**
   * Delete a school (super admin only)
   */
  @Delete(':id')
  @Roles('super_admin')
  remove(@Param('id') id: string): Promise<void> {
    return this.schoolService.remove(id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('logo')
  @Roles('school_admin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @CurrentUser() user: SchoolAdmin,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const school = await this.schoolService.findOne(user.school.id);
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const { path: logoPath, url: logoUrl } =
      await this.objectStorageService.uploadProfileImage(file, school.id);

    if (school.logoPath) {
      await this.objectStorageService.deleteProfileImage(
        school.id,
        school.logoPath,
      );
    }

    school.logoPath = logoPath;
    school.mediaType = file.mimetype;
    await this.schoolRepository.save(school);

    return {
      message: 'School logo uploaded successfully',
      logoUrl,
      school,
    };
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('update-calendly-url')
  @Roles('school_admin')
  async updateCalendlyUrl(
    @CurrentUser() user: SchoolAdmin,
    @Body() body: UpdateCalendlyUrlDto,
  ) {

    if (user.school.id !== body.schoolId) {
      throw new BadRequestException('You can only update your own school URL');
    }

    const updatedSchool = await this.schoolService.updateCalendlyUrl(
      body.schoolId,
      body.calendlyUrl
    );


    return {
      message: 'Calendly URL updated successfully',
      school: updatedSchool,
    };
  }
}
