import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { UpdateSuperAdminDto } from './dto/update-super-admin.dto';
import { SuperAdmin } from './super-admin.entity';
import { SuperAdminJwtAuthGuard } from './guards/super-admin-jwt-auth.guard';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @UseGuards(SuperAdminJwtAuthGuard)
  @Get()
  async findAll(): Promise<SuperAdmin[]> {
    return this.superAdminService.findAll();
  }

  @UseGuards(SuperAdminJwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SuperAdmin> {
    return this.superAdminService.findOne(id);
  }

  //TODO: ADD endpoints
  @UseGuards(SuperAdminJwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSuperAdminDto: UpdateSuperAdminDto,
  ): Promise<SuperAdmin> {
    return this.superAdminService.update(id, updateSuperAdminDto);
  }

  @UseGuards(SuperAdminJwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.superAdminService.remove(id);
  }
}
