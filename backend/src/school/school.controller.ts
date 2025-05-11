import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SchoolService } from './school.service';
import { School } from './school.entity';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { CreateSchoolDto } from './dto/create-school.dto';
import { CurrentUser } from 'src/user/current-user.decorator';
import { User } from 'src/user/user.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SuperAdminJwtAuthGuard } from 'src/super-admin/guards/super-admin-jwt-auth.guard';

@Controller('schools')
@UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  /**
   * Create a new school
   * School admins can create one school and will be associated with it
   */
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
  @Get()
  @Roles('super_admin')
  findAll(): Promise<School[]> {
    return this.schoolService.findAll();
  }

  @Get(':id')
  @Roles('super_admin')
  findOne(@Param('id') id: string): Promise<School> {
    return this.schoolService.findOneWithDetails(id);
  }

  /**
   * Update a school
   * Super admins can update any school, school admins can only update their own
   */
  @Put(':id')
  @Roles('school_admin')
  update(
    @Param('id') id: string,
    @Body() schoolData: Partial<School>,
    @CurrentUser() user: User,
  ): Promise<School> {
    return this.schoolService.update(id, schoolData, user);
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
