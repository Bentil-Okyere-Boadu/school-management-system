import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { PlannerEvent, EventVisibility } from './entities/planner-event.entity';
import { EventCategory } from './entities/event-category.entity';
import { CreatePlannerEventDto } from './dto/create-planner-event.dto';
import { UpdatePlannerEventDto } from './dto/update-planner-event.dto';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { School } from '../school/school.entity';
import { ClassLevel } from '../class-level/class-level.entity';

@Injectable()
export class PlannerService {
  constructor(
    @InjectRepository(PlannerEvent)
    private plannerEventRepository: Repository<PlannerEvent>,
    @InjectRepository(EventCategory)
    private eventCategoryRepository: Repository<EventCategory>,
    @InjectRepository(ClassLevel)
    private classLevelRepository: Repository<ClassLevel>,
  ) {}

  // ========== EVENT METHODS ==========

  async createEvent(
    createEventDto: CreatePlannerEventDto,
    admin: SchoolAdmin,
  ): Promise<PlannerEvent> {
    const { classLevelIds, categoryId, startDate, endDate, reminderDate, ...eventData } = createEventDto;

    const event = this.plannerEventRepository.create({
      ...eventData,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      reminderDate: reminderDate ? new Date(reminderDate) : undefined,
      school: { id: admin.school.id } as School,
      createdBy: admin,
    });

    // Set category if provided
    if (categoryId) {
      const category = await this.eventCategoryRepository.findOne({
        where: { id: categoryId, school: { id: admin.school.id } },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID ${categoryId} not found in this school`,
        );
      }
      event.category = category;
    }

    // Set class levels if visibility is CLASS
    if (
      createEventDto.visibility === EventVisibility.CLASS &&
      classLevelIds &&
      classLevelIds.length > 0
    ) {
      const classLevels = await this.classLevelRepository.findBy({
        id: In(classLevelIds),
        school: { id: admin.school.id },
      });

      if (classLevels.length !== classLevelIds.length) {
        const foundIds = classLevels.map((cl) => cl.id);
        const missingIds = classLevelIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Class levels not found in this school: ${missingIds.join(', ')}`,
        );
      }

      event.classLevels = classLevels;
    }

    return this.plannerEventRepository.save(event);
  }

  async findAllEvents(
    schoolId: string,
    startDate?: string,
    endDate?: string,
    categoryId?: string,
    visibility?: EventVisibility,
  ): Promise<PlannerEvent[]> {
    const queryBuilder = this.plannerEventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.category', 'category')
      .leftJoinAndSelect('event.classLevels', 'classLevels')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .where('event.schoolId = :schoolId', { schoolId });

    if (startDate && endDate) {
      queryBuilder.andWhere(
        '(event.startDate BETWEEN :startDate AND :endDate OR event.endDate BETWEEN :startDate AND :endDate OR (event.startDate <= :startDate AND event.endDate >= :endDate))',
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('event.categoryId = :categoryId', { categoryId });
    }

    if (visibility) {
      queryBuilder.andWhere('event.visibility = :visibility', { visibility });
    }

    return queryBuilder
      .orderBy('event.startDate', 'ASC')
      .getMany();
  }

  async findOneEvent(id: string, schoolId: string): Promise<PlannerEvent> {
    const event = await this.plannerEventRepository.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['category', 'classLevels', 'createdBy'],
    });

    if (!event) {
      throw new NotFoundException(
        `Event with ID ${id} not found in this school`,
      );
    }

    return event;
  }

  async updateEvent(
    id: string,
    updateEventDto: UpdatePlannerEventDto,
    admin: SchoolAdmin,
  ): Promise<PlannerEvent> {
    const event = await this.plannerEventRepository.findOne({
      where: { id, school: { id: admin.school.id } },
      relations: ['category', 'classLevels'],
    });

    if (!event) {
      throw new NotFoundException(
        `Event with ID ${id} not found in this school`,
      );
    }

    const { classLevelIds, categoryId, startDate, endDate, reminderDate, ...eventData } = updateEventDto;

    // Update basic fields
    Object.assign(event, eventData);
    
    if (startDate !== undefined) {
      event.startDate = new Date(startDate);
    }
    if (endDate !== undefined) {
      event.endDate = endDate ? new Date(endDate) : undefined;
    }
    if (reminderDate !== undefined) {
      event.reminderDate = reminderDate ? new Date(reminderDate) : undefined;
    }

    // Update category if provided
    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await this.eventCategoryRepository.findOne({
          where: { id: categoryId, school: { id: admin.school.id } },
        });
        if (!category) {
          throw new NotFoundException(
            `Category with ID ${categoryId} not found in this school`,
          );
        }
        event.category = category;
      } else {
        event.category = undefined;
      }
    }

    // Update class levels if visibility is CLASS
    if (
      updateEventDto.visibility === EventVisibility.CLASS &&
      classLevelIds !== undefined
    ) {
      if (classLevelIds && classLevelIds.length > 0) {
        const classLevels = await this.classLevelRepository.findBy({
          id: In(classLevelIds),
          school: { id: admin.school.id },
        });

        if (classLevels.length !== classLevelIds.length) {
          const foundIds = classLevels.map((cl) => cl.id);
          const missingIds = classLevelIds.filter((id) => !foundIds.includes(id));
          throw new NotFoundException(
            `Class levels not found in this school: ${missingIds.join(', ')}`,
          );
        }

        event.classLevels = classLevels;
      } else {
        event.classLevels = [];
      }
    }

    return this.plannerEventRepository.save(event);
  }

  async deleteEvent(id: string, schoolId: string): Promise<void> {
    const event = await this.plannerEventRepository.findOne({
      where: { id, school: { id: schoolId } },
    });

    if (!event) {
      throw new NotFoundException(
        `Event with ID ${id} not found in this school`,
      );
    }

    await this.plannerEventRepository.remove(event);
  }

  // ========== CATEGORY METHODS ==========

  async createCategory(
    createCategoryDto: CreateEventCategoryDto,
    admin: SchoolAdmin,
  ): Promise<EventCategory> {
    const category = this.eventCategoryRepository.create({
      ...createCategoryDto,
      school: { id: admin.school.id } as School,
    });

    return this.eventCategoryRepository.save(category);
  }

  async findAllCategories(schoolId: string): Promise<EventCategory[]> {
    return this.eventCategoryRepository.find({
      where: { school: { id: schoolId } },
      order: { name: 'ASC' },
    });
  }

  async findOneCategory(id: string, schoolId: string): Promise<EventCategory> {
    const category = await this.eventCategoryRepository.findOne({
      where: { id, school: { id: schoolId } },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${id} not found in this school`,
      );
    }

    return category;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateEventCategoryDto,
    admin: SchoolAdmin,
  ): Promise<EventCategory> {
    const category = await this.eventCategoryRepository.findOne({
      where: { id, school: { id: admin.school.id } },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${id} not found in this school`,
      );
    }

    Object.assign(category, updateCategoryDto);
    return this.eventCategoryRepository.save(category);
  }

  async deleteCategory(id: string, schoolId: string): Promise<void> {
    const category = await this.eventCategoryRepository.findOne({
      where: { id, school: { id: schoolId } },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${id} not found in this school`,
      );
    }

    await this.eventCategoryRepository.remove(category);
  }
}

