import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { AdmissionPolicyService } from './admission-policy.service';
import { CreateAdmissionPolicyDto } from './dto/create-admission-policy.dto';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Role } from 'src/auth/enums/role.enum';

@Controller('admission-policies')
@UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
export class AdmissionPolicyController {
  constructor(
    private readonly admissionPolicyService: AdmissionPolicyService,
  ) {}

  @Post()
  @Roles(Role.SchoolAdmin)
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createAdmissionPolicyDto: CreateAdmissionPolicyDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.admissionPolicyService.create(
      createAdmissionPolicyDto,
      file,
      admin,
    );
  }

  @Get()
  findAll(@CurrentUser() admin: SchoolAdmin) {
    return this.admissionPolicyService.findAll(admin);
  }

  @Get(':id')
  @Roles(Role.SchoolAdmin)
  findOne(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.admissionPolicyService.getPolicyWithDocumentUrl(id, admin);
  }

  @Delete(':id/document')
  @Roles(Role.SchoolAdmin)
  removeDocument(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.admissionPolicyService.removeDocument(id, admin);
  }
}
