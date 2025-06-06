import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FeeStructure } from './fee-structure.entity';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { School } from '../school/school.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';

@Injectable()
export class FeeStructureService {
  constructor(
    @InjectRepository(FeeStructure)
    private feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(ClassLevel)
    private classLevelRepository: Repository<ClassLevel>,
  ) {}

  /**
   * Find all fee structures for a specific school
   */
  async findAllBySchool(schoolId: string): Promise<any[]> {
    const feeStructures = await this.feeStructureRepository
      .createQueryBuilder('fee')
      .leftJoinAndSelect('fee.classLevels', 'classLevel')
      .where('fee.schoolId = :schoolId', { schoolId })
      .getMany();

    return feeStructures.map((fee) => ({
      id: fee.id,
      feeTitle: fee.feeTitle,
      feeType: fee.feeType,
      amount: fee.amount,
      appliesTo: fee.appliesTo,
      dueDate: fee.dueDate,
      classLevels: fee.classLevels?.map((cl) => cl.id) ?? [],
    }));
  }

  /**
   * Create a new fee structure
   */
  async create(
    createFeeStructureDto: CreateFeeStructureDto,
    school: School,
  ): Promise<FeeStructure> {
    const { classLevelIds, ...feeData } = createFeeStructureDto;

    const newFeeStructure = this.feeStructureRepository.create({
      ...feeData,
      school,
    });

    // If classLevelIds are provided, fetch and associate the ClassLevels
    if (classLevelIds && classLevelIds.length > 0) {
      const classLevels = await this.classLevelRepository.findBy({
        id: In(classLevelIds),
        school: { id: school.id },
      });

      if (classLevels.length !== classLevelIds.length) {
        const foundIds = classLevels.map((cl) => cl.id);
        const missingIds = classLevelIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Class levels not found in this school: ${missingIds.join(', ')}`,
        );
      }

      newFeeStructure.classLevels = classLevels;
    }

    return this.feeStructureRepository.save(newFeeStructure);
  }

  async update(
    id: string,
    updateFeeStructureDto: UpdateFeeStructureDto,
    schoolId: string,
  ): Promise<FeeStructure> {
    const existingFee = await this.feeStructureRepository.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['classLevels'],
    });

    if (!existingFee) {
      throw new NotFoundException(
        `Fee structure with ID ${id} not found in this school`,
      );
    }

    const { classLevelIds, ...feeData } = updateFeeStructureDto;

    Object.assign(existingFee, feeData);

    if (classLevelIds) {
      if (classLevelIds.length > 0) {
        const classLevels = await this.classLevelRepository.findBy({
          id: In(classLevelIds),
          school: { id: schoolId },
        });

        if (classLevels.length !== classLevelIds.length) {
          const foundIds = classLevels.map((cl) => cl.id);
          const missingIds = classLevelIds.filter(
            (id) => !foundIds.includes(id),
          );
          throw new NotFoundException(
            `Class levels not found in this school: ${missingIds.join(', ')}`,
          );
        }

        existingFee.classLevels = classLevels;
      } else {
        existingFee.classLevels = [];
      }
    }

    return this.feeStructureRepository.save(existingFee);
  }

  /**
   * Delete a fee structure
   */
  async remove(id: string, schoolId: string): Promise<void> {
    // First check if the fee belongs to the school
    const existingFee = await this.feeStructureRepository.findOne({
      where: { id, school: { id: schoolId } },
    });

    if (!existingFee) {
      throw new NotFoundException(
        `Fee structure with ID ${id} not found in this school`,
      );
    }

    await this.feeStructureRepository.remove(existingFee);
  }
}
