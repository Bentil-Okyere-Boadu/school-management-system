import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  async findAllBySchool(schoolId: string): Promise<FeeStructure[]> {
    return this.feeStructureRepository.find({
      where: { school: { id: schoolId } },
      relations: ['classLevel'],
    });
  }

  /**
   * Create a new fee structure
   */
  async create(
    createFeeStructureDto: CreateFeeStructureDto,
    school: School,
  ): Promise<FeeStructure> {
    const { classLevelId, ...feeData } = createFeeStructureDto;

    const newFeeStructure = this.feeStructureRepository.create({
      ...feeData,
      school,
    });

    // If classLevelId is provided, fetch and associate the ClassLevel
    //Todo find a way to link to student category entity

    if (classLevelId) {
      const classLevel = await this.classLevelRepository.findOne({
        where: { id: classLevelId, school: { id: school.id } },
      });

      if (!classLevel) {
        throw new NotFoundException(
          `Class level with ID ${classLevelId} not found in this school`,
        );
      }

      newFeeStructure.classLevel = classLevel;
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
      relations: ['classLevel'],
    });

    if (!existingFee) {
      throw new NotFoundException(
        `Fee structure with ID ${id} not found in this school`,
      );
    }

    const { classLevelId, ...feeData } = updateFeeStructureDto;

    Object.assign(existingFee, feeData);

    if (classLevelId) {
      const classLevel = await this.classLevelRepository.findOne({
        where: { id: classLevelId, school: { id: schoolId } },
      });

      if (!classLevel) {
        throw new NotFoundException(
          `Class level with ID ${classLevelId} not found in this school`,
        );
      }

      existingFee.classLevel = classLevel;
    } else if (classLevelId === null) {
      // If classLevelId is explicitly set to null, remove the association
      existingFee.classLevel = undefined;
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
