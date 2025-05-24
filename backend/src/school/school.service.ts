import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { InvitationService } from 'src/invitation/invitation.service';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(SchoolAdmin)
    private adminRepository: Repository<SchoolAdmin>,
    private invitationService: InvitationService,
  ) {}

  async create(
    createSchoolDto: CreateSchoolDto,
    adminUser: SchoolAdmin,
  ): Promise<School> {
    if (adminUser.role.name !== 'school_admin') {
      throw new UnauthorizedException('Only school admins can create schools');
    }

    if (adminUser.school) {
      throw new UnauthorizedException('Admin already associated with a school');
    }

    const school = this.schoolRepository.create(createSchoolDto);

    const savedSchool = await this.schoolRepository.save(school);
    if (!savedSchool.schoolCode) {
      savedSchool.schoolCode = savedSchool.id
        .toString()
        .padStart(5, '0')
        .substring(0, 5);
      await this.schoolRepository.save(savedSchool); // Update schoolCode
    }

    adminUser.school = savedSchool;

    if (!adminUser.adminId) {
      const adminId = await this.invitationService.generateAdminId(
        savedSchool,
        adminUser,
      );
      adminUser.adminId = adminId;
    }

    await this.adminRepository.save(adminUser);

    return savedSchool;
  }

  async findOneWithDetails(id: string): Promise<any> {
    const school = await this.schoolRepository.findOne({
      where: { id },
      relations: [
        'admissionPolicies',
        'gradingSystems',
        'feeStructures',
        'profile',
        'academicCalendars',
        'academicCalendars.terms.holidays',
        'classLevels',
        'classLevels.teachers',
        'classLevels.students',
        'students',
        'teachers',
      ],
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    const { students, teachers, ...rest } = school;

    const users = [...(students || []), ...(teachers || [])];

    return {
      ...rest,
      users,
    };
  }

  async findAll(): Promise<School[]> {
    return this.schoolRepository.find();
  }

  async findOne(id: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    return school;
  }

  async getMySchoolWithRelations(user: SchoolAdmin) {
    if (!user.school) {
      throw new NotFoundException('School not found for this admin');
    }

    const school = await this.schoolRepository.findOne({
      where: { id: user.school.id },
      relations: [
        'admissionPolicies',
        'gradingSystems',
        'feeStructures',
        'profile',
        'academicCalendars',
        'classLevels',
      ],
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${user.school.id} not found`);
    }

    return school;
  }

  async remove(id: string): Promise<void> {
    // Check if school exists
    await this.findOne(id);

    // Only super_admin can remove schools
    // This check will be in the controller

    await this.schoolRepository.delete(id);
  }
}
