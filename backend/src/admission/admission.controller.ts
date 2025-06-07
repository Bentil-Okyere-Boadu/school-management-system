import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { AdmissionService } from './admission.service';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';

@Controller('admissions')
export class AdmissionController {
  constructor(private readonly admissionService: AdmissionService) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async createAdmission(
    @Body() createAdmissionDto: CreateAdmissionDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.admissionService.createAdmission(createAdmissionDto, files);
  }

  @Get('class-levels/:schoolId')
  getClassLevelsBySchool(@Param('schoolId') schoolId: string) {
    return this.admissionService.findAllNamesBySchool(schoolId);
  }
  @UseGuards(SchoolAdminJwtAuthGuard)
  @Roles('school_admin')
  @Get('url/me')
  getAdmissionUrlForAdmin(@CurrentUser() admin: SchoolAdmin) {
    return this.admissionService.getAdmissionUrlForAdmin(admin);
  }
}
