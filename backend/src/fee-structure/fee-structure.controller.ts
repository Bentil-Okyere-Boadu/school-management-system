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
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

@Controller('fee-structure')
export class FeeStructureController {
  constructor(private readonly feeStructureService: FeeStructureService) {}

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Get('my-school')
  @Roles(Role.SchoolAdmin, Role.SuperAdmin)
  async findAllForMySchool(@CurrentUser() user: SchoolAdmin) {
    if (!user.school) {
      throw new BadRequestException('No school found for this admin');
    }
    return this.feeStructureService.findAllBySchool(user.school.id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Post()
  @Roles(Role.SchoolAdmin)
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
  @Roles(Role.SchoolAdmin)
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
  @Roles(Role.SchoolAdmin)
  async remove(@Param('id') id: string, @CurrentUser() user: SchoolAdmin) {
    if (!user.school) {
      throw new BadRequestException('No school found for this admin');
    }
    await this.feeStructureService.remove(id, user.school.id);
    return { message: 'Fee structure deleted successfully' };
  }
  //Todo: add reminder service to send reminders to students
}
