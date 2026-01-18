import {
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
import { ClassLevelService } from './class-level.service';
import { CreateClassLevelDto } from './dto/create-class-level.dto';
import { UpdateClassLevelDto } from './dto/update-class-level.dto';
import { SchoolAdminSchoolGuard } from 'src/school-admin/guards/school-admin-school.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { QueryString } from 'src/common/api-features/api-features';

@Controller('class-level')
@Roles(Role.SchoolAdmin)
export class ClassLevelController {
  constructor(private readonly classLevelService: ClassLevelService) {}

  @UseGuards(SchoolAdminJwtAuthGuard, SchoolAdminSchoolGuard)
  @Roles(Role.SchoolAdmin)
  @Post()
  async create(
    @Body() createClassLevelDto: CreateClassLevelDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.classLevelService.create(createClassLevelDto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, SchoolAdminSchoolGuard)
  @Roles(Role.SchoolAdmin)
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
  @Roles(Role.SuperAdmin, Role.SchoolAdmin)
  async findOne(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.classLevelService.findOne(id, admin);
  }
  @UseGuards(SchoolAdminJwtAuthGuard, SchoolAdminSchoolGuard)
  @Get()
  @Roles(Role.SchoolAdmin)
  async findAll(
    @CurrentUser() admin: SchoolAdmin,
    @Query() query: QueryString,
  ) {
    return this.classLevelService.findAll(admin, query);
  }

  // @UseGuards(SchoolAdminJwtAuthGuard, SchoolAdminSchoolGuard)
  // @Get('teacher/:teacherId/class-teacher')
  // @Roles('school_admin')
  // async getClassesWhereTeacherIsClassTeacher(
  //   @Param('teacherId') teacherId: string,
  //   @Query() query: QueryString,
  // ) {
  //   return this.classLevelService.getClassesWhereTeacherIsClassTeacher(
  //     teacherId,
  //     query,
  //   );
  // }

  @UseGuards(SchoolAdminJwtAuthGuard, SchoolAdminSchoolGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.classLevelService.remove(id, admin);
  }
}
