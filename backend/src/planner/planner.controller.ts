import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlannerService } from './planner.service';
import { CreatePlannerEventDto } from './dto/create-planner-event.dto';
import { UpdatePlannerEventDto } from './dto/update-planner-event.dto';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';
import { SchoolAdminJwtAuthGuard } from '../school-admin/guards/school-admin-jwt-auth.guard';
import { SchoolAdminSchoolGuard } from '../school-admin/guards/school-admin-school.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { EventVisibility } from './entities/planner-event.entity';

@Controller('planner')
@UseGuards(SchoolAdminJwtAuthGuard, SchoolAdminSchoolGuard)
@Roles(Role.SchoolAdmin)
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  // ========== EVENT ENDPOINTS ==========

  @Post('events')
  async createEvent(
    @Body() createEventDto: CreatePlannerEventDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.plannerService.createEvent(createEventDto, admin);
  }

  @Get('events')
  async findAllEvents(
    @CurrentUser() admin: SchoolAdmin,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string,
    @Query('visibility') visibility?: EventVisibility,
  ) {
    return this.plannerService.findAllEvents(
      admin.school.id,
      startDate,
      endDate,
      categoryId,
      visibility,
    );
  }

  @Get('events/:id')
  async findOneEvent(
    @Param('id') id: string,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.plannerService.findOneEvent(id, admin.school.id);
  }

  @Patch('events/:id')
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdatePlannerEventDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.plannerService.updateEvent(id, updateEventDto, admin);
  }

  @Delete('events/:id')
  async deleteEvent(
    @Param('id') id: string,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    await this.plannerService.deleteEvent(id, admin.school.id);
    return { message: 'Event deleted successfully' };
  }

  // ========== CATEGORY ENDPOINTS ==========

  @Post('categories')
  async createCategory(
    @Body() createCategoryDto: CreateEventCategoryDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.plannerService.createCategory(createCategoryDto, admin);
  }

  @Get('categories')
  async findAllCategories(@CurrentUser() admin: SchoolAdmin) {
    return this.plannerService.findAllCategories(admin.school.id);
  }

  @Get('categories/:id')
  async findOneCategory(
    @Param('id') id: string,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.plannerService.findOneCategory(id, admin.school.id);
  }

  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateEventCategoryDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.plannerService.updateCategory(id, updateCategoryDto, admin);
  }

  @Delete('categories/:id')
  async deleteCategory(
    @Param('id') id: string,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    await this.plannerService.deleteCategory(id, admin.school.id);
    return { message: 'Category deleted successfully' };
  }
}

