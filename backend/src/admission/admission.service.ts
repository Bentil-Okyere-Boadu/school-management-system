import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admission } from './admission.entity';
import { Guardian } from './guardian.entity';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { ObjectStorageServiceService } from '../object-storage-service/object-storage-service.service';

@Injectable()
export class AdmissionService {
  constructor(
    @InjectRepository(Admission)
    private readonly admissionRepository: Repository<Admission>,
    @InjectRepository(Guardian)
    private readonly guardianRepository: Repository<Guardian>,
    private readonly objectStorageService: ObjectStorageServiceService,
  ) {}

  async createAdmission(
    createAdmissionDto: CreateAdmissionDto,
    files: Array<Express.Multer.File>,
  ) {
    // Helper to find a file by fieldname
    const findFile = (field: string) =>
      files.find((f) => f.fieldname === field);

    // 1. Handle student headshot
    const studentHeadshotFile = findFile('studentHeadshot');
    if (studentHeadshotFile) {
      const { path, url } = await this.objectStorageService.uploadProfileImage(
        studentHeadshotFile,
        createAdmissionDto.studentEmail || createAdmissionDto.studentFirstName,
      );
      createAdmissionDto.studentHeadshotPath = path;
      createAdmissionDto.studentHeadshotMediaType =
        studentHeadshotFile.mimetype;
    }

    // 2. Handle student birth cert
    const studentBirthCertFile = findFile('studentBirthCert');
    if (studentBirthCertFile) {
      const { path } =
        await this.objectStorageService.uploadAdmissionPolicyDocument(
          studentBirthCertFile,
          createAdmissionDto.schoolId,
          'birth-cert',
        );
      createAdmissionDto.studentBirthCertUrl = path;
    }

    // 3. Handle previous school result
    const previousSchoolResultFile = findFile('previousSchoolResult');
    if (previousSchoolResultFile) {
      const { path } =
        await this.objectStorageService.uploadAdmissionPolicyDocument(
          previousSchoolResultFile,
          createAdmissionDto.schoolId,
          'prev-result',
        );
      createAdmissionDto.previousSchoolResultPath = path;
      createAdmissionDto.previousSchoolResultMediaType =
        previousSchoolResultFile.mimetype;
    }

    // 4. Handle guardian headshots
    if (Array.isArray(createAdmissionDto.guardians)) {
      for (let i = 0; i < createAdmissionDto.guardians.length; i++) {
        const guardian = createAdmissionDto.guardians[i];
        const field = `guardianHeadshot_${i}`;
        const guardianHeadshotFile = findFile(field);
        if (guardianHeadshotFile) {
          const { path } = await this.objectStorageService.uploadProfileImage(
            guardianHeadshotFile,
            guardian.email || guardian.firstName,
          );
          guardian.headshotPath = path;
          guardian.headshotMediaType = guardianHeadshotFile.mimetype;
        }
      }
    }

    // 5. Create Admission entity
    const { guardians, forClassId, ...admissionData } = createAdmissionDto;
    const admission = this.admissionRepository.create({
      ...admissionData,
      forClass: forClassId ? { id: forClassId } : undefined,
    });
    await this.admissionRepository.save(admission);

    // 6. Create Guardian entities
    if (Array.isArray(guardians)) {
      for (const guardianDto of guardians) {
        const guardian = this.guardianRepository.create({
          ...guardianDto,
          admission,
        });
        await this.guardianRepository.save(guardian);
      }
    }

    // 7. Return the created admission with guardians
    return this.admissionRepository.findOne({
      where: { applicationId: admission.applicationId },
      relations: ['guardians', 'forClass'],
    });
  }
}
