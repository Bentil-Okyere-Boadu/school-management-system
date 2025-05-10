import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolAdmin } from './school-admin.entity';
@Injectable()
export class SchoolAdminService {
  constructor(
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
  ) {}

  async findAll(): Promise<SchoolAdmin[]> {
    return this.schoolAdminRepository.find();
  }

  async findOne(id: string): Promise<SchoolAdmin> {
    const schoolAdmin = await this.schoolAdminRepository.findOne({
      where: { id },
    });

    if (!schoolAdmin) {
      throw new NotFoundException(`School admin with ID ${id} not found`);
    }

    return schoolAdmin;
  }

  async update(
    id: string,
    updateSchoolAdminDto: Partial<SchoolAdmin>,
  ): Promise<SchoolAdmin> {
    const schoolAdmin = await this.findOne(id);
    Object.assign(schoolAdmin, updateSchoolAdminDto);
    return this.schoolAdminRepository.save(schoolAdmin);
  }

  async remove(id: string): Promise<void> {
    const schoolAdmin = await this.findOne(id);
    await this.schoolAdminRepository.remove(schoolAdmin);
  }

  getMySchool(user: SchoolAdmin) {
    if (!user.school) {
      throw new NotFoundException('School not found for this admin');
    }
    return user.school;
  }
}
