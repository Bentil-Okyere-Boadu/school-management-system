import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
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

    const existingParent = await this.parentRepository.findOne({
      where: { email: createParentDto.email },
    });

    if (existingParent) {
      throw new ConflictException(
        `A parent with the email "${createParentDto.email}" already exists`,
      );
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

  async update(
    id: string,
    updateParentDto: UpdateParentDto,
    studentId?: string,
  ) {
    const parent = await this.parentRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${id} not found`);
    }

    if (studentId && parent.student?.id !== studentId) {
      throw new ForbiddenException(
        'You do not have permission to update this parent',
      );
    }

    if (updateParentDto.email && updateParentDto.email !== parent.email) {
      const existingParent = await this.parentRepository.findOne({
        where: { email: updateParentDto.email },
      });

      if (existingParent && existingParent.id !== id) {
        throw new ConflictException(
          `A parent with the email "${updateParentDto.email}" already exists`,
        );
      }
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
