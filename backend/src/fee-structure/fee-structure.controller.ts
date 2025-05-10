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
import { FeeStructureService } from './fee-structure.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { CurrentUser } from 'src/user/current-user.decorator';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('fee-structure')
export class FeeStructureController {
  constructor(private readonly feeStructureService: FeeStructureService) {}

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Get('my-school')
  @Roles('school_admin', 'super_admin')
  async findAllForMySchool(@CurrentUser() user: SchoolAdmin) {
    if (!user.school) {
      throw new BadRequestException('No school found for this admin');
    }
    return this.feeStructureService.findAllBySchool(user.school.id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Post()
  @Roles('school_admin')
  async create(
    @Body() createFeeStructureDto: CreateFeeStructureDto,
    @CurrentUser() user: SchoolAdmin,
  ) {
    if (!user.school) {
      throw new BadRequestException('No school found for this admin');
    }
    return this.feeStructureService.create(createFeeStructureDto, user.school);
  }

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Put(':id')
  @Roles('school_admin')
  async update(
    @Param('id') id: string,
    @Body() updateFeeStructureDto: UpdateFeeStructureDto,
    @CurrentUser() user: SchoolAdmin,
  ) {
    if (!user.school) {
      throw new BadRequestException('No school found for this admin');
    }
    return this.feeStructureService.update(
      id,
      updateFeeStructureDto,
      user.school.id,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Delete(':id')
  @Roles('school_admin')
  async remove(@Param('id') id: string, @CurrentUser() user: SchoolAdmin) {
    if (!user.school) {
      throw new BadRequestException('No school found for this admin');
    }
    await this.feeStructureService.remove(id, user.school.id);
    return { message: 'Fee structure deleted successfully' };
  }
  //Todo: add reminder service to send reminders to students
}
