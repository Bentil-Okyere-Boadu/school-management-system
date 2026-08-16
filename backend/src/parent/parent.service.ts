import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parent } from './parent.entity';
import { CreateParentDto } from './dto/create-parent-dto';
import { UpdateParentDto } from './dto/update-parent-dto';
import { ParentLinkService } from './parent-link.service';
import { ParentStudent } from './parent-student.entity';
import { ParentStudentSource, ParentStudentStatus } from './parent.enums';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(ParentStudent)
    private parentStudentRepository: Repository<ParentStudent>,
    private readonly parentLinkService: ParentLinkService,
  ) {}

  async create(createParentDto: CreateParentDto, studentId: string) {
    const { parent, relationship } =
      await this.parentLinkService.linkGuardianToStudent(studentId, {
        firstName: createParentDto.firstName,
        lastName: createParentDto.lastName,
        email: createParentDto.email,
        phone: createParentDto.phone,
        relationship: createParentDto.relationship,
        occupation: createParentDto.occupation,
        address: createParentDto.address,
        source: ParentStudentSource.StudentProfile,
      });

    return {
      ...parent,
      relationship: relationship.relationship,
      relationshipStatus: relationship.status,
      relationshipId: relationship.id,
    };
  }

  async listGuardiansForStudent(studentId: string) {
    const links = await this.parentStudentRepository.find({
      where: { student: { id: studentId } },
      relations: ['parent', 'parent.profile'],
      order: { createdAt: 'DESC' },
    });
    return links
      .filter((link) => link.status !== ParentStudentStatus.Revoked)
      .map((link) => ({
        ...link.parent,
        relationship: link.relationship,
        relationshipStatus: link.status,
        relationshipId: link.id,
      }));
  }

  async findOne(id: string): Promise<Parent> {
    const parent = await this.parentRepository.findOne({
      where: { id },
      relations: ['school', 'parentStudents', 'parentStudents.student'],
    });
    if (!parent) throw new NotFoundException('Parent not found');
    return parent;
  }

  async update(
    id: string,
    updateParentDto: UpdateParentDto,
    studentId?: string,
  ) {
    if (!studentId) {
      throw new ForbiddenException(
        'A student context is required to update a guardian',
      );
    }

    const { parent, relationship } =
      await this.parentLinkService.updateGuardianForStudent(id, studentId, {
        firstName: updateParentDto.firstName ?? '',
        lastName: updateParentDto.lastName ?? '',
        email: updateParentDto.email,
        phone: updateParentDto.phone,
        relationship: updateParentDto.relationship,
        occupation: updateParentDto.occupation,
        address: updateParentDto.address,
        source: ParentStudentSource.StudentProfile,
      });

    return {
      ...parent,
      relationship: relationship.relationship,
      relationshipStatus: relationship.status,
      relationshipId: relationship.id,
    };
  }

  async remove(id: string, studentId?: string) {
    const link = await this.parentStudentRepository.findOne({
      where: studentId
        ? { parent: { id }, student: { id: studentId } }
        : { id },
      relations: ['parent', 'student', 'school'],
    });

    if (!link) {
      const byParent = await this.parentStudentRepository.findOne({
        where: { parent: { id } },
        relations: ['parent', 'student', 'school'],
      });
      if (!byParent) {
        throw new NotFoundException('Parent not found');
      }
      await this.parentLinkService.adminRevoke(byParent);
      return { message: 'Parent relationship revoked successfully' };
    }

    await this.parentLinkService.adminRevoke(link);
    return { message: 'Parent relationship revoked successfully' };
  }
}
