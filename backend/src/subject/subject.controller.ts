import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SubjectService } from './subject.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { Subject } from './subject.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post()
  async create(
    @Body() createSubjectDto: CreateSubjectDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.subjectService.create(createSubjectDto, admin);
  }
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.subjectService.update(id, updateSubjectDto, admin);
  }
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    await this.subjectService.remove(id, admin);
    return { message: 'Subject deleted successfully' };
  }
}
