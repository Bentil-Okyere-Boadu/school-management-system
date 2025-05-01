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
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { CreateSchoolDto } from './dto/create-school.dto';
import { CurrentUser } from 'src/user/current-user.decorator';
import { User } from 'src/user/user.entity';

@Controller('schools')
@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  /**
   * Create a new school
   * School admins can create one school and will be associated with it
   */
  @Post()
  @Roles('school_admin')
  create(
    @Body() createSchoolDto: CreateSchoolDto,
    @CurrentUser() user: User,
  ): Promise<School> {
    return this.schoolService.create(createSchoolDto, user);
  }

  /**
   * Get all schools (super admin only)
   */
  @Get()
  @Roles('super_admin')
  findAll(): Promise<School[]> {
    return this.schoolService.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'school_admin')
  findOne(@Param('id') id: string, @CurrentUser() user: User): Promise<School> {
    if (user.role.name === 'school_admin') {
      // School admin can only view their own school
      if (!user.school || user.school.id !== id) {
        throw new Error('You can only view your own school');
      }
    }
    return this.schoolService.findOne(id);
  }

  /**
   * Get the school associated with the current admin user
   */
  @Get('my/school')
  @Roles('school_admin')
  findMySchool(@CurrentUser() user: User): Promise<School> {
    return this.schoolService.findByAdmin(user);
  }

  /**
   * Update a school
   * Super admins can update any school, school admins can only update their own
   */
  @Put(':id')
  @Roles('super_admin', 'school_admin')
  update(
    @Param('id') id: string,
    @Body() schoolData: Partial<School>,
    @CurrentUser() user: User,
  ): Promise<School> {
    return this.schoolService.update(id, schoolData, user);
  }

  /**
   * Delete a school (super admin only)
   */
  @Delete(':id')
  @Roles('super_admin')
  remove(@Param('id') id: string): Promise<void> {
    return this.schoolService.remove(id);
  }
}
