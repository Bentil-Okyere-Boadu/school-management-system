import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradingSystem } from './grading-system.entity';
import { CreateGradingSystemDto } from './dto/create-grading-system.dto';
import { UpdateGradingSystemDto } from './dto/update-grading-system.dto';
import { School } from '../school/school.entity';

@Injectable()
export class GradingSystemService {
  constructor(
    @InjectRepository(GradingSystem)
    private gradingSystemRepository: Repository<GradingSystem>,
  ) {}

  /**
   * Find all grading system items for a specific school
   */
  async findAllBySchool(schoolId: string): Promise<GradingSystem[]> {
    return this.gradingSystemRepository.find({
      where: { school: { id: schoolId } },
      order: { minRange: 'DESC' }, // Sort by minRange in descending order
    });
  }

  /**
   * Create a new grading system item
   */
  async create(
    createGradingSystemDto: CreateGradingSystemDto,
    school: School,
  ): Promise<GradingSystem> {
    // Validate that minRange < maxRange
    if (createGradingSystemDto.minRange > createGradingSystemDto.maxRange) {
      throw new Error('Minimum range cannot be greater than maximum range');
    }

    // Check for overlapping ranges with existing grades in this school
    await this.validateRanges(
      createGradingSystemDto.minRange,
      createGradingSystemDto.maxRange,
      school.id,
    );

    const newGrading = this.gradingSystemRepository.create({
      ...createGradingSystemDto,
      school,
    });

    return this.gradingSystemRepository.save(newGrading);
  }

  /**
   * Update an existing grading system item
   */
  async update(
    id: string,
    updateGradingSystemDto: UpdateGradingSystemDto,
    schoolId: string,
  ): Promise<GradingSystem> {
    // First check if the grading system item belongs to the school
    const existingGrade = await this.gradingSystemRepository.findOne({
      where: { id, school: { id: schoolId } },
    });

    if (!existingGrade) {
      throw new NotFoundException(`Grading system with ID ${id} not found in this school`);
    }

    // If updating ranges, validate them
    if (
      updateGradingSystemDto.minRange !== undefined ||
      updateGradingSystemDto.maxRange !== undefined
    ) {
      const minRange = updateGradingSystemDto.minRange ?? existingGrade.minRange;
      const maxRange = updateGradingSystemDto.maxRange ?? existingGrade.maxRange;

      // Validate that minRange < maxRange
      if (minRange > maxRange) {
        throw new Error('Minimum range cannot be greater than maximum range');
      }

      // Check for overlapping ranges with other grades (excluding this one)
      await this.validateRanges(minRange, maxRange, schoolId, id);
    }

    // Update the grading data
    Object.assign(existingGrade, updateGradingSystemDto);

    return this.gradingSystemRepository.save(existingGrade);
  }

  /**
   * Delete a grading system item
   */
  async remove(id: string, schoolId: string): Promise<void> {
    // First check if the grading system item belongs to the school
    const existingGrade = await this.gradingSystemRepository.findOne({
      where: { id, school: { id: schoolId } },
    });

    if (!existingGrade) {
      throw new NotFoundException(`Grading system with ID ${id} not found in this school`);
    }

    await this.gradingSystemRepository.remove(existingGrade);
  }

  /**
   * Validate that the provided range doesn't overlap with existing grades
   */
  private async validateRanges(
    minRange: number,
    maxRange: number,
    schoolId: string,
    excludeId?: string,
  ): Promise<void> {
    // Create the where clause conditionally
    const whereClause: any = {
      school: { id: schoolId },
    };

    // If excludeId is provided, exclude that grade from the check
    if (excludeId) {
      whereClause.id = { $ne: excludeId };
    }

    const existingGrades = await this.gradingSystemRepository.find({
      where: whereClause,
    });

    // Check for overlap with any existing grade
    for (const grade of existingGrades) {
      // Skip the grade we're updating if excludeId is provided
      if (excludeId && grade.id === excludeId) continue;

      // Check if ranges overlap
      if (
        (minRange >= grade.minRange && minRange <= grade.maxRange) ||
        (maxRange >= grade.minRange && maxRange <= grade.maxRange) ||
        (minRange <= grade.minRange && maxRange >= grade.maxRange)
      ) {
        throw new Error(
          `Range ${minRange}-${maxRange} overlaps with existing grade ${grade.grade} (${grade.minRange}-${grade.maxRange})`,
        );
      }
    }
  }
}
