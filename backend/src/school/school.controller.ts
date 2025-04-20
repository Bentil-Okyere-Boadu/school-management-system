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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('schools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post()
  @Roles('super_admin')
  create(@Body() schoolData: Partial<School>): Promise<School> {
    return this.schoolService.create(schoolData);
  }

  @Get()
  @Roles('super_admin')
  findAll(): Promise<School[]> {
    return this.schoolService.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  findOne(@Param('id') id: string): Promise<School> {
    return this.schoolService.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin')
  update(
    @Param('id') id: string,
    @Body() schoolData: Partial<School>,
  ): Promise<School> {
    return this.schoolService.update(id, schoolData);
  }

  @Delete(':id')
  @Roles('super_admin')
  remove(@Param('id') id: string): Promise<void> {
    return this.schoolService.remove(id);
  }
}
