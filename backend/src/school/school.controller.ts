/* eslint-disable prettier/prettier */
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
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SchoolService } from './school.service';
import { School } from './school.entity';
import { RolesGuard } from 'src/auth/roles.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateCalendlyUrlDto } from './dto/update-calendly-url.dto';
import { UpdateParentResultVisibilityDto } from './dto/update-parent-result-visibility.dto';
import { UpdateGradingPercentagesDto } from './dto/update-grading-percentages.dto';
import { UpdateHubtelMerchantDto } from './dto/update-hubtel-merchant.dto';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SuperAdminJwtAuthGuard } from 'src/super-admin/guards/super-admin-jwt-auth.guard';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { SkipTenantScope } from 'src/common/tenant/skip-tenant-scope.decorator';
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
  @Roles(Role.SchoolAdmin)
  @SkipTenantScope()
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
  @Roles(Role.SuperAdmin)
  findAll(): Promise<School[]> {
    return this.schoolService.findAll();
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('dashboard')
  async getDashboardData() {
    return this.schoolService.getSuperAdminDashboardStats();
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete('logo')
  @Roles(Role.SchoolAdmin)
  async deleteLogo(@CurrentUser() user: SchoolAdmin) {
    const school = await this.schoolService.deleteLogo(user.school.id);

    return {
      message: 'School logo deleted successfully',
      school,
    };
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':id')
  @Roles(Role.SuperAdmin)
  @UseInterceptors(DeepSanitizeResponseInterceptor)
  findOne(@Param('id') id: string): Promise<School> {
    return this.schoolService.findOneWithDetails(id);
  }

  /**
   * Delete a school (super admin only)
   */
  @Delete(':id')
  @Roles(Role.SuperAdmin)
  remove(@Param('id') id: string): Promise<void> {
    return this.schoolService.remove(id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('logo')
  @Roles(Role.SchoolAdmin)
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
  @Roles(Role.SchoolAdmin)
  async updateCalendlyUrl(
    @CurrentUser() user: SchoolAdmin,
    @Body() body: UpdateCalendlyUrlDto,
  ) {
    if (user.school.id !== body.schoolId) {
      throw new BadRequestException('You can only update your own school URL');
    }

    const updatedSchool = await this.schoolService.updateCalendlyUrl(
      body.schoolId,
      body.calendlyUrl,
    );

    return {
      message: 'Calendly URL updated successfully',
      school: updatedSchool,
    };
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Patch('parent-result-visibility')
  @Roles(Role.SchoolAdmin)
  async updateParentResultVisibility(
    @CurrentUser() user: SchoolAdmin,
    @Body() body: UpdateParentResultVisibilityDto,
  ) {
    const updatedSchool = await this.schoolService.updateParentResultVisibility(
      user.school.id,
      body,
    );
    return {
      message: 'Parent result visibility updated',
      school: updatedSchool,
    };
  }

  /**
   * SuperAdmin: read masked view of a school's Hubtel merchant configuration.
   * The client secret is never returned.
   */
  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':id/hubtel-merchant')
  @Roles(Role.SuperAdmin)
  async getHubtelMerchant(@Param('id') id: string) {
    const merchant = await this.schoolService.getHubtelMerchant(id);
    return { schoolId: id, merchant };
  }

  /**
   * SuperAdmin: set or rotate a school's Hubtel merchant credentials.
   * The provided clientSecret is encrypted at rest (AES-256-GCM).
   */
  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put(':id/hubtel-merchant')
  @Roles(Role.SuperAdmin)
  async setHubtelMerchant(
    @Param('id') id: string,
    @Body() body: UpdateHubtelMerchantDto,
  ) {
    const merchant = await this.schoolService.setHubtelMerchant(id, body);
    return {
      message: 'Hubtel merchant configuration updated',
      schoolId: id,
      merchant,
    };
  }

  /**
   * SuperAdmin: clear a school's Hubtel merchant credentials and deactivate.
   */
  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete(':id/hubtel-merchant')
  @Roles(Role.SuperAdmin)
  async clearHubtelMerchant(@Param('id') id: string) {
    const merchant = await this.schoolService.clearHubtelMerchant(id);
    return {
      message: 'Hubtel merchant configuration cleared',
      schoolId: id,
      merchant,
    };
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('update-grading-percentages')
  @Roles(Role.SchoolAdmin)
  async updateGradingPercentages(
    @CurrentUser() user: SchoolAdmin,
    @Body() body: UpdateGradingPercentagesDto,
  ) {
    if (user.school.id !== body.schoolId) {
      throw new BadRequestException(
        'You can only update your own school grading percentages',
      );
    }

    const updatedSchool = await this.schoolService.updateGradingPercentages(
      body.schoolId,
      body.classScorePercentage,
      body.examScorePercentage,
    );

    return {
      message: 'Grading percentages updated successfully',
      school: updatedSchool,
    };
  }
}
