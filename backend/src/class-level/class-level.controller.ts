import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClassLevelService } from './class-level.service';
import { CreateClassLevelDto } from './dto/create-class-level.dto';
import { UpdateClassLevelDto } from './dto/update-class-level.dto';
import { SchoolAdminLocalAuthGuard } from 'src/school-admin/guards/school-admin-local-auth.guard';
import { SchoolAdminSchoolGuard } from 'src/school-admin/guards/school-admin-school.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';

@Controller('class-level')
@Roles('school_admin')
export class ClassLevelController {
  constructor(private readonly classLevelService: ClassLevelService) {}

  @UseGuards(SchoolAdminJwtAuthGuard, SchoolAdminSchoolGuard)
  @Roles('school_admin')
  @Post()
  async create(
    @Body() createClassLevelDto: CreateClassLevelDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.classLevelService.create(createClassLevelDto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, SchoolAdminSchoolGuard)
  @Roles('school_admin')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateClassLevelDto: UpdateClassLevelDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.classLevelService.update(id, updateClassLevelDto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, SchoolAdminSchoolGuard)
  @Get(':id')
  @Roles('super_admin', 'school_admin')
  async findOne(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.classLevelService.findOne(id, admin);
  }
  @UseGuards(SchoolAdminJwtAuthGuard, SchoolAdminSchoolGuard)
  @Get()
  @Roles('school_admin')
  async findAll(@CurrentUser() admin: SchoolAdmin) {
    return this.classLevelService.findAll(admin);
  }
}
