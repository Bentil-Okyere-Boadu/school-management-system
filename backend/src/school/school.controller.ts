import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SchoolService } from './school.service';
import { School } from './school.entity';
import { RolesGuard } from 'src/auth/roles.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { CreateSchoolDto } from './dto/create-school.dto';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SuperAdminJwtAuthGuard } from 'src/super-admin/guards/super-admin-jwt-auth.guard';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { DeepSanitizeResponseInterceptor } from 'src/common/interceptors/deep-sanitize-response.interceptor';

@Controller('schools')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

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
}
