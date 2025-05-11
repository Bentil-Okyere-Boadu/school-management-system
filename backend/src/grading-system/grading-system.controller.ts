import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  BadRequestException,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { GradingSystemService } from './grading-system.service';
import { CreateGradingSystemDto } from './dto/create-grading-system.dto';
import { UpdateGradingSystemDto } from './dto/update-grading-system.dto';
import { CurrentUser } from 'src/user/current-user.decorator';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('grading-system')
export class GradingSystemController {
  constructor(private readonly gradingSystemService: GradingSystemService) {}

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Get('my-school')
  @Roles('school_admin', 'super_admin')
  async findAllForMySchool(@CurrentUser() user: SchoolAdmin) {
    if (!user.school) {
      throw new BadRequestException('No school found for this admin');
    }
    return this.gradingSystemService.findAllBySchool(user.school.id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Post()
  @Roles('school_admin')
  async create(
    @Body() createGradingSystemDto: CreateGradingSystemDto,
    @CurrentUser() user: SchoolAdmin,
  ) {
    if (!user.school) {
      throw new BadRequestException('No school found for this admin');
    }
    
    try {
      return await this.gradingSystemService.create(
        createGradingSystemDto,
        user.school,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Put(':id')
  @Roles('school_admin')
  async update(
    @Param('id') id: string,
    @Body() updateGradingSystemDto: UpdateGradingSystemDto,
    @CurrentUser() user: SchoolAdmin,
  ) {
    if (!user.school) {
      throw new BadRequestException('No school found for this admin');
    }
    
    try {
      return await this.gradingSystemService.update(
        id,
        updateGradingSystemDto,
        user.school.id,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Delete(':id')
  @Roles('school_admin')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: SchoolAdmin,
  ) {
    if (!user.school) {
      throw new BadRequestException('No school found for this admin');
    }
    
    await this.gradingSystemService.remove(id, user.school.id);
    return { message: 'Grading system item deleted successfully' };
  }
}
