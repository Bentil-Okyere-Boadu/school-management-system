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
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Role } from 'src/auth/enums/role.enum';

@Controller('grading-system')
export class GradingSystemController {
  constructor(private readonly gradingSystemService: GradingSystemService) {}

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Get('my-school')
  @Roles(Role.SchoolAdmin, Role.SuperAdmin)
  async findAllForMySchool(@CurrentUser() user: SchoolAdmin) {
    if (!user.school) {
      throw new BadRequestException('No school found for this admin');
    }
    return this.gradingSystemService.findAllBySchool(user.school.id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Post()
  @Roles(Role.SchoolAdmin)
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
  @Roles(Role.SchoolAdmin)
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
  @Roles(Role.SchoolAdmin)
  async remove(@Param('id') id: string, @CurrentUser() user: SchoolAdmin) {
    if (!user.school) {
      throw new BadRequestException('No school found for this admin');
    }

    await this.gradingSystemService.remove(id, user.school.id);
    return { message: 'Grading system item deleted successfully' };
  }
}
