import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Parent } from './parent.entity';
import { Student } from '../student/student.entity';
import { CreateParentDto } from './dto/create-parent-dto';
import { UpdateParentDto } from './dto/update-parent-dto';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async create(
    createParentDto: CreateParentDto,
    studentId: string,
  ): Promise<Parent> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const parent = this.parentRepository.create({
      ...createParentDto,
      student,
    });

    return this.parentRepository.save(parent);
  }

  async findAll(): Promise<Parent[]> {
    return this.parentRepository.find({ relations: ['students'] });
  }

  async findOne(id: string): Promise<Parent> {
    const parent = await this.parentRepository.findOne({
      where: { id },
      relations: ['student'],
    });
    if (!parent) throw new NotFoundException('Parent not found');
    return parent;
  }

  async update(id: string, updateParentDto: UpdateParentDto): Promise<Parent> {
    const parent = await this.parentRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    if (updateParentDto.studentId) {
      const student = await this.studentRepository.findOne({
        where: { id: updateParentDto.studentId },
      });

      if (!student) {
        throw new NotFoundException(`Student not found`);
      }

      parent.student = student;
    }

    Object.assign(parent, updateParentDto);
    return this.parentRepository.save(parent);
  }

  async remove(id: string) {
    const parent = await this.parentRepository.findOne({ where: { id } });
    if (!parent) throw new NotFoundException('Parent not found');
    await this.parentRepository.remove(parent);
    return {
      message: 'Parent deleted successfully',
    };
  }
}
