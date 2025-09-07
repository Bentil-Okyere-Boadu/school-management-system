import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClassLevel } from './class-level.entity';
import { UpdateClassLevelDto } from './dto/update-class-level.dto';
import { Teacher } from '../teacher/teacher.entity';
import { Student } from '../student/student.entity';
import { CreateClassLevelDto } from './dto/create-class-level.dto';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { APIFeatures, QueryString } from 'src/common/api-features/api-features';
import { AcademicCalendarService } from '../academic-calendar/academic-calendar.service';
import { ClassLevelResultApproval } from 'src/class-level/class-level-result-approval.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';

@Injectable()
export class ClassLevelService {
  constructor(
    @InjectRepository(ClassLevel)
    private readonly classLevelRepository: Repository<ClassLevel>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private readonly academicCalendarService: AcademicCalendarService,
    @InjectRepository(ClassLevelResultApproval)
    private classLevelResultApprovalRepository: Repository<ClassLevelResultApproval>,
    @InjectRepository(AcademicTerm)
    private academicTermRepository: Repository<AcademicTerm>,
  ) {}

  async create(
    createClassLevelDto: CreateClassLevelDto,
    admin: SchoolAdmin,
  ): Promise<ClassLevel> {
    const { name, description, teacherIds, studentIds, classTeacherId } =
      createClassLevelDto;

    // 1. Check if any student is already assigned to a class
    if (studentIds && studentIds.length > 0) {
      const students = await this.studentRepository.find({
        where: { id: In(studentIds) },
        relations: ['classLevels'],
      });

      const studentsWithClass = students.filter(
        (s) => s.classLevels && s.classLevels.length > 0,
      );

      if (studentsWithClass.length > 0) {
        const namesWithClasses = studentsWithClass
          .map((s) => {
            const classNames = s.classLevels.map((cl) => cl.name).join(', ');
            return `${s.firstName} ${s.lastName} (Class: ${classNames})`;
          })
          .join(', ');
        throw new ConflictException(
          `Student(s) already assigned to a class: ${namesWithClasses}`,
        );
      }
    }

    // 3. Create new class level
    const classLevel = this.classLevelRepository.create({
      name,
      description,
      school: { id: admin.school.id },
    });

    // Assign class teacher if provided
    if (classTeacherId) {
      classLevel.classTeacher = (await this.teacherRepository.findOneBy({
        id: classTeacherId,
      })) as Teacher;
    }

    // Assign other teachers
    if (teacherIds && teacherIds.length > 0) {
      classLevel.teachers = await this.teacherRepository.findBy({
        id: In(teacherIds),
      });
    }

    // Assign students
    if (studentIds && studentIds.length > 0) {
      classLevel.students = await this.studentRepository.findBy({
        id: In(studentIds),
      });
    }

    return this.classLevelRepository.save(classLevel);
  }

  async update(
    id: string,
    updateClassLevelDto: UpdateClassLevelDto,
    admin: SchoolAdmin,
  ): Promise<ClassLevel> {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id, school: { id: admin.school.id } },
      relations: ['teachers', 'students', 'classTeacher'],
    });

    if (!classLevel) {
      throw new NotFoundException(`Class level with ID ${id} not found`);
    }

    // Update basic properties
    if (updateClassLevelDto.name) {
      classLevel.name = updateClassLevelDto.name;
    }
    if (updateClassLevelDto.description) {
      classLevel.description = updateClassLevelDto.description;
    }

    // Update class teacher if provided
    if (updateClassLevelDto.classTeacherId) {
      const classTeacher = await this.teacherRepository.findOne({
        where: {
          id: updateClassLevelDto.classTeacherId,
          school: { id: admin.school.id },
        },
      });
      if (!classTeacher) {
        throw new NotFoundException(
          `Teacher with ID ${updateClassLevelDto.classTeacherId} not found in this school`,
        );
      }
      classLevel.classTeacher = classTeacher;
    }

    // Update teacher associations
    if (updateClassLevelDto.teacherIds) {
      classLevel.teachers = await this.teacherRepository.findBy({
        id: In(updateClassLevelDto.teacherIds),
      });
    }

    // Update student associations
    if (updateClassLevelDto.studentIds) {
      // Check if any student is already assigned to a class (other than this one)
      const students = await this.studentRepository.find({
        where: { id: In(updateClassLevelDto.studentIds) },
        relations: ['classLevels'],
      });
      const studentsWithOtherClass = students.filter(
        (s) => s.classLevels && s.classLevels.some((cl) => cl.id !== id),
      );
      if (studentsWithOtherClass.length > 0) {
        const namesWithClasses = studentsWithOtherClass
          .map((s) => {
            const classNames = s.classLevels
              .filter((cl) => cl.id !== id)
              .map((cl) => cl.name)
              .join(', ');
            return `${s.firstName} ${s.lastName} (Class: ${classNames})`;
          })
          .join(', ');
        throw new ConflictException(
          `Student(s) already assigned to another class: ${namesWithClasses}`,
        );
      }
      classLevel.students = students;
    }

    return this.classLevelRepository.save(classLevel);
  }
  async getClassLevelNameById(
    id: string,
  ): Promise<{ id: string; name: string }> {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id },
      select: ['id', 'name'],
    });
    if (!classLevel) {
      throw new NotFoundException(`Class level with ID ${id} not found`);
    }
    return classLevel;
  }
  async findOne(id: string, admin: SchoolAdmin): Promise<ClassLevel> {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id, school: { id: admin.school.id } },
      relations: ['teachers', 'students', 'classTeacher'],
    });

    if (!classLevel) {
      throw new NotFoundException(`Class level with ID ${id} not found`);
    }

    return classLevel;
  }
  async remove(id: string, admin: SchoolAdmin): Promise<{ message: string }> {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id, school: { id: admin.school.id } },
    });

    if (!classLevel) {
      throw new NotFoundException(`Class level with ID ${id} not found`);
    }

    await this.classLevelRepository.remove(classLevel);
    return { message: 'Class level deleted successfully' };
  }
  async findAll(
    admin: SchoolAdmin,
    query?: QueryString,
  ): Promise<ClassLevel[]> {
    const queryBuilder = this.classLevelRepository
      .createQueryBuilder('classLevel')
      .leftJoinAndSelect('classLevel.teachers', 'teacher')
      .leftJoinAndSelect('classLevel.students', 'student')
      .leftJoinAndSelect('classLevel.classTeacher', 'classTeacher')
      .where('classLevel.school.id = :schoolId', { schoolId: admin.school.id });

    if (query) {
      const features = new APIFeatures(queryBuilder, query).search(['name']);
      let classes = await features.getQuery().getMany();

      const latestTerm = await this.academicTermRepository.findOne({
        where: { academicCalendar: { school: { id: admin.school.id } } },
        order: { startDate: 'DESC' },
      });

      if (latestTerm) {
        const classLevelIds = classes.map((c) => c.id);
        const classLevelApprovals =
          await this.classLevelResultApprovalRepository.find({
            where: {
              classLevel: { id: In(classLevelIds) },
              academicTerm: { id: latestTerm.id },
            },
          });
        const approvalMap = new Map<string, ClassLevelResultApproval>(
          classLevelApprovals.map((approval) => [
            approval.classLevel.id,
            approval,
          ]),
        );
        classes = classes.map((classLevel) => {
          const approval = approvalMap.get(classLevel.id);
          return {
            ...classLevel,
            isApproved: approval?.approved || false,
            approvedAt: approval?.approvedAt,
            schoolAdminApproved: approval?.schoolAdminApproved || false,
            schoolAdminApprovedAt: approval?.schoolAdminApprovedAt,
          };
        });
      }
      return classes;
    }
    let classes = await queryBuilder.getMany();

    const latestTerm = await this.academicTermRepository.findOne({
      where: { academicCalendar: { school: { id: admin.school.id } } },
      order: { startDate: 'DESC' },
    });

    if (latestTerm) {
      const classLevelIds = classes.map((c) => c.id);
      const classLevelApprovals =
        await this.classLevelResultApprovalRepository.find({
          where: {
            classLevel: { id: In(classLevelIds) },
            academicTerm: { id: latestTerm.id },
          },
        });
      const approvalMap = new Map<string, ClassLevelResultApproval>(
        classLevelApprovals.map((approval) => [
          approval.classLevel.id,
          approval,
        ]),
      );
      classes = classes.map((classLevel) => {
        const approval = approvalMap.get(classLevel.id);
        return {
          ...classLevel,
          isApproved: approval?.approved || false,
          approvedAt: approval?.approvedAt,
          schoolAdminApproved: approval?.schoolAdminApproved || false,
          schoolAdminApprovedAt: approval?.schoolAdminApprovedAt,
        };
      });
    }
    return classes;
  }

  async getClassesForTeacher(teacherId: string, query?: QueryString) {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
      relations: ['school'],
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const currentCalendar =
      await this.academicCalendarService.getCurrentAcademicCalendar(
        teacher.school.id,
      );
    if (!currentCalendar) {
      return [];
    }

    const latestTerm = await this.academicCalendarService.getLatestTerm(
      currentCalendar.id,
    );
    if (!latestTerm) {
      return [];
    }

    const classes = await this.classLevelRepository
      .createQueryBuilder('classLevel')
      .leftJoinAndSelect('classLevel.students', 'student')
      .leftJoinAndSelect('classLevel.teachers', 'teacher')
      .leftJoinAndSelect('classLevel.classTeacher', 'classTeacher')
      .where('teacher.id = :teacherId', { teacherId })
      .orWhere('classTeacher.id = :teacherId', { teacherId })
      .loadRelationCountAndMap('classLevel.studentCount', 'classLevel.students')
      .getMany();

    if (classes.length === 0) {
      return [];
    }

    const classLevelIds = classes.map((c) => c.id);
    const classLevelApprovals =
      await this.classLevelResultApprovalRepository.find({
        where: {
          classLevel: { id: In(classLevelIds) },
          academicTerm: { id: latestTerm.id },
        },
      });

    const approvalMap = new Map<string, ClassLevelResultApproval>(
      classLevelApprovals.map((approval) => [approval.classLevel.id, approval]),
    );

    const results = classes.map((classLevel) => {
      const approval = approvalMap.get(classLevel.id);
      return {
        ...classLevel,
        isApproved: approval?.approved || false,
        approvedAt: approval?.approvedAt,
        schoolAdminApproved: approval?.schoolAdminApproved || false,
        schoolAdminApprovedAt: approval?.schoolAdminApprovedAt,
      };
    });

    if (query) {
      // Temporarily create a mock query builder for APIFeatures to apply search and pagination on the `results` array
      let filteredResults = results;
      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        filteredResults = filteredResults.filter((item) =>
          item.name.toLowerCase().includes(searchTerm),
        );
      }
      const page = parseInt(query.page!) || 1;
      const limit = parseInt(query.limit!) || 10;
      const skip = (page - 1) * limit;
      return filteredResults.slice(skip, skip + limit);
    }

    return results;
  }

  async getClassesWhereTeacherIsClassTeacher(
    teacherId: string,
    query?: QueryString,
  ) {
    const queryBuilder = this.classLevelRepository
      .createQueryBuilder('classLevel')
      .leftJoinAndSelect('classLevel.students', 'student')
      .leftJoinAndSelect('classLevel.teachers', 'teacher')
      .leftJoinAndSelect('classLevel.classTeacher', 'classTeacher')
      .where('classTeacher.id = :teacherId', { teacherId })
      .loadRelationCountAndMap(
        'classLevel.studentCount',
        'classLevel.students',
      );

    if (query) {
      const features = new APIFeatures(queryBuilder, query).search(['name']);
      return features.getQuery().getMany();
    }
    return queryBuilder.getMany();
  }
}
