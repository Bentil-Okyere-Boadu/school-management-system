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
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(SchoolAdmin)
    private adminRepository: Repository<SchoolAdmin>,
    private objectStorageService: ObjectStorageServiceService,
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

    // Sign admission policy document URLs
    const signedAdmissionPolicies = await Promise.all(
      school.admissionPolicies.map(async (policy) => {
        const result = { ...policy } as typeof policy & {
          documentUrl?: string;
        };
        if (policy.documentPath) {
          try {
            result.documentUrl = await this.objectStorageService.getSignedUrl(
              policy.documentPath,
              86400,
            );
          } catch {
            // skip silently
          }
        }
        return result;
      }),
    );

    // Sign school profile avatar
    const signedSchoolProfile = school.profile
      ? {
          ...school.profile,
          avatarUrl: school.profile.avatarPath
            ? await this.objectStorageService.getSignedUrl(
                school.profile.avatarPath,
                3600,
              )
            : undefined,
        }
      : undefined;

    // Combine students and teachers
    const users = [...(school.students || []), ...(school.teachers || [])];

    // Sign avatarUrls for users (if they have profile with avatarPath)
    const signedUsers = await Promise.all(
      users.map(async (user) => {
        if (user.profile?.avatarPath) {
          try {
            const avatarUrl = await this.objectStorageService.getSignedUrl(
              user.profile.avatarPath,
              3600,
            );
            return {
              ...user,
              profile: {
                ...user.profile,
                avatarUrl,
              },
            };
          } catch {
            return user;
          }
        }
        return user;
      }),
    );

    const { students, teachers, ...rest } = school;

    return {
      ...rest,
      admissionPolicies: signedAdmissionPolicies,
      profile: signedSchoolProfile,
      users: signedUsers,
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
