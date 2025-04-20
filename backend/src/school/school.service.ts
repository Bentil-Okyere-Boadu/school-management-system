import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './school.entity';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
  ) {}

  async create(schoolData: Partial<School>): Promise<School> {
    const school = this.schoolRepository.create(schoolData);
    return this.schoolRepository.save(school);
  }

  async findAll(): Promise<School[]> {
    return this.schoolRepository.find();
  }

  async findOne(id: string): Promise<School> {
    const school = await this.schoolRepository.findOne({ where: { id } });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }
    return school;
  }

  async update(id: string, schoolData: Partial<School>): Promise<School> {
    await this.schoolRepository.update(id, schoolData);
    const updatedSchool = await this.schoolRepository.findOne({ where: { id } });
    if (!updatedSchool) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }
    return updatedSchool;
  }

  async remove(id: string): Promise<void> {
    await this.schoolRepository.delete(id);
  }
} 