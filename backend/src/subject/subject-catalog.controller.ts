import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubjectCatalog } from './subject-catalog.entity';
import { SchoolAdminJwtAuthGuard } from '../school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
@Controller('subject-catalog')
@UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(Role.SchoolAdmin)
export class SubjectCatalogController {
  constructor(
    @InjectRepository(SubjectCatalog)
    private readonly subjectCatalogRepository: Repository<SubjectCatalog>,
  ) {}

  @Post()
  async create(
    @Body('name') name: string,
    @Body('description') description: string,
    @CurrentUser() admin: SchoolAdmin,
  ): Promise<SubjectCatalog> {
    if (!admin.school) {
      throw new NotFoundException('Admin is not associated with a school');
    }
    const subject = this.subjectCatalogRepository.create({
      name,
      school: admin.school,
      description,
    });
    return this.subjectCatalogRepository.save(subject);
  }

  @Get()
  async findAll(@CurrentUser() admin: SchoolAdmin) {
    if (!admin.school) {
      throw new NotFoundException('Admin is not associated with a school');
    }

    const catalogs = await this.subjectCatalogRepository.find({
      where: { school: { id: admin.school.id } },
    });
    return catalogs;
  }
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    if (!admin.school) {
      throw new NotFoundException('Admin is not associated with a school');
    }

    const catalogs = await this.subjectCatalogRepository
      .createQueryBuilder('catalog')
      .leftJoin('catalog.subjects', 'subject')
      .leftJoin('subject.teacher', 'teacher')
      .leftJoin('subject.classLevels', 'classLevel')
      .where('catalog.id = :id', { id })
      .andWhere('catalog.school_id = :schoolId', { schoolId: admin.school.id })
      .select([
        'catalog.id',
        'catalog.name',
        'catalog.description',
        'subject.id',
        'subjectCatalog.id',
        'subjectCatalog.name',
        'teacher.id',
        'teacher.firstName',
        'teacher.lastName',
        'teacher.email',
        'classLevel.id',
        'classLevel.name',
      ])
      .addSelect('subjectCatalog.id')
      .leftJoin('subject.subjectCatalog', 'subjectCatalog')
      .getMany();

    return catalogs;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body('name') name: string,
    @Body('description') description: string,
    @CurrentUser() admin: SchoolAdmin,
  ): Promise<SubjectCatalog> {
    if (!admin.school) {
      throw new NotFoundException('Admin is not associated with a school');
    }
    const subject = await this.subjectCatalogRepository.findOneOrFail({
      where: { id, school: { id: admin.school.id } },
    });
    subject.name = name;
    subject.description = description;
    return this.subjectCatalogRepository.save(subject);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    if (!admin.school) {
      throw new NotFoundException('Admin is not associated with a school');
    }
    const subject = await this.subjectCatalogRepository.findOneOrFail({
      where: { id, school: { id: admin.school.id } },
    });
    if (!subject) {
      throw new NotFoundException('Subject catalog not found');
    }
    await this.subjectCatalogRepository.delete(subject.id);
    return { message: 'Subject catalog deleted successfully' };
  }
}
