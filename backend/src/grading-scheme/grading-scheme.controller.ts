import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GradingSchemeService } from './grading-scheme.service';
import { CreateGradingSchemeDto } from './dto/create-grading-scheme.dto';
import { UpdateGradingSchemeDto } from './dto/update-grading-scheme.dto';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { GradingSchemeStatus } from './grading-scheme.entity';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('grading-schemes')
@UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
export class GradingSchemeController {
  constructor(private readonly gradingSchemeService: GradingSchemeService) {}

  private requireSchool(user: SchoolAdmin) {
    if (!user.school) {
      throw new BadRequestException('No school found for this admin');
    }
    return user.school;
  }

  @Get()
  @Roles(Role.SchoolAdmin, Role.SuperAdmin)
  async list(
    @CurrentUser() user: SchoolAdmin,
    @Query('status') status?: GradingSchemeStatus,
  ) {
    const school = this.requireSchool(user);
    return this.gradingSchemeService.list(school.id, status);
  }

  @Get(':id')
  @Roles(Role.SchoolAdmin, Role.SuperAdmin)
  async getOne(@Param('id') id: string, @CurrentUser() user: SchoolAdmin) {
    const school = this.requireSchool(user);
    return this.gradingSchemeService.getOne(id, school.id);
  }

  @Post()
  @Roles(Role.SchoolAdmin)
  async create(
    @Body() dto: CreateGradingSchemeDto,
    @CurrentUser() user: SchoolAdmin,
  ) {
    const school = this.requireSchool(user);
    return this.gradingSchemeService.create(dto, school, user);
  }

  @Patch(':id')
  @Roles(Role.SchoolAdmin)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGradingSchemeDto,
    @CurrentUser() user: SchoolAdmin,
  ) {
    const school = this.requireSchool(user);
    return this.gradingSchemeService.update(id, dto, school.id, user);
  }

  @Post(':id/duplicate')
  @Roles(Role.SchoolAdmin)
  async duplicate(@Param('id') id: string, @CurrentUser() user: SchoolAdmin) {
    const school = this.requireSchool(user);
    return this.gradingSchemeService.duplicate(id, school.id, user);
  }

  @Post(':id/activate')
  @Roles(Role.SchoolAdmin)
  async activate(@Param('id') id: string, @CurrentUser() user: SchoolAdmin) {
    const school = this.requireSchool(user);
    return this.gradingSchemeService.activate(id, school.id, user);
  }

  @Post(':id/deactivate')
  @Roles(Role.SchoolAdmin)
  async deactivate(@Param('id') id: string, @CurrentUser() user: SchoolAdmin) {
    const school = this.requireSchool(user);
    return this.gradingSchemeService.deactivate(id, school.id, user);
  }

  @Post(':id/new-version')
  @Roles(Role.SchoolAdmin)
  async newVersion(@Param('id') id: string, @CurrentUser() user: SchoolAdmin) {
    const school = this.requireSchool(user);
    return this.gradingSchemeService.newVersion(id, school.id, user);
  }

  @Delete(':id')
  @Roles(Role.SchoolAdmin)
  async remove(@Param('id') id: string, @CurrentUser() user: SchoolAdmin) {
    const school = this.requireSchool(user);
    return this.gradingSchemeService.remove(id, school.id);
  }
}
