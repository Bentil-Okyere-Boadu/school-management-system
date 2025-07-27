import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { Teacher } from '../teacher/teacher.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { SubjectCatalog } from './subject-catalog.entity';
import { School } from '../school/school.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { StudentGrade } from './student-grade.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';
import { AcademicCalendar } from '../academic-calendar/entitites/academic-calendar.entity';
import { Student } from '../student/student.entity';
import { GradingSystem } from '../grading-system/grading-system.entity';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(ClassLevel)
    private classLevelRepository: Repository<ClassLevel>,
    @InjectRepository(SubjectCatalog)
    private subjectCatalogRepository: Repository<SubjectCatalog>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(StudentGrade)
    private studentGradeRepository: Repository<StudentGrade>,
    @InjectRepository(AcademicTerm)
    private academicTermRepository: Repository<AcademicTerm>,
    @InjectRepository(AcademicCalendar)
    private academicCalendarRepository: Repository<AcademicCalendar>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(GradingSystem)
    private gradingSystemRepository: Repository<GradingSystem>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto, admin: SchoolAdmin) {
    const { subjectCatalogId, classLevelIds, teacherId } = createSubjectDto;

    // Validate subject catalog
    const subjectCatalog = await this.subjectCatalogRepository.findOne({
      where: { id: subjectCatalogId },
    });
    if (!subjectCatalog) {
      throw new NotFoundException('Subject catalog entry not found');
    }

    // Validate teacher
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Validate admin and school
    if (!admin.school) {
      throw new NotFoundException('Admin is not associated with a school');
    }

    const school = await this.schoolRepository.findOne({
      where: { id: admin.school.id },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Check if subject already exists for (catalog + teacher + school)
    let subject = await this.subjectRepository.findOne({
      where: {
        subjectCatalog: { id: subjectCatalog.id },
        teacher: { id: teacher.id },
        school: { id: school.id },
      },
      relations: ['classLevels'],
    });

    if (!subject) {
      subject = this.subjectRepository.create({
        subjectCatalog,
        teacher,
        school,
        classLevels: [],
      });
    }

    // Fetch class levels
    const classLevels = await Promise.all(
      classLevelIds.map(async (id) => {
        const level = await this.classLevelRepository.findOne({
          where: { id },
        });
        if (!level) {
          throw new NotFoundException(`Class level not found: ${id}`);
        }
        return level;
      }),
    );

    subject.classLevels = classLevels;
    const saved = await this.subjectRepository.save(subject);

    return {
      id: saved.id,
      subjectCatalog: {
        id: subjectCatalog.id,
        name: subjectCatalog.name,
      },
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        fullName: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
      },
      classLevels: classLevels.map((level) => ({
        id: level.id,
        name: level.name,
      })),
    };
  }

  async update(
    id: string,
    updateSubjectDto: UpdateSubjectDto,
    admin: SchoolAdmin,
  ) {
    const subject = await this.subjectRepository.findOne({
      where: { id, school: { id: admin.school.id } },
      relations: ['classLevels', 'subjectCatalog', 'teacher'],
    });

    if (!subject) throw new NotFoundException('Subject not found');

    if (updateSubjectDto.subjectCatalogId) {
      const subjectCatalog = await this.subjectCatalogRepository.findOne({
        where: { id: updateSubjectDto.subjectCatalogId },
      });
      if (!subjectCatalog)
        throw new NotFoundException('Subject catalog not found');
      subject.subjectCatalog = subjectCatalog;
    }

    if (updateSubjectDto.teacherId) {
      const foundTeacher = await this.teacherRepository.findOne({
        where: { id: updateSubjectDto.teacherId },
      });
      if (!foundTeacher) throw new NotFoundException('Teacher not found');
      subject.teacher = foundTeacher;
    }

    if (
      updateSubjectDto.classLevelIds &&
      updateSubjectDto.classLevelIds.length > 0
    ) {
      const classLevels: ClassLevel[] = [];
      for (const classLevelId of updateSubjectDto.classLevelIds) {
        const classLevel = await this.classLevelRepository.findOne({
          where: { id: classLevelId },
        });
        if (!classLevel)
          throw new NotFoundException(`Class level not found: ${classLevelId}`);
        classLevels.push(classLevel);
      }
      subject.classLevels = classLevels;
    }

    const saved = await this.subjectRepository.save(subject);

    return {
      id: saved.id,
      subjectCatalog: {
        id: saved.subjectCatalog.id,
        name: saved.subjectCatalog.name,
      },
      teacher: {
        id: saved.teacher.id,
        firstName: saved.teacher.firstName,
        lastName: saved.teacher.lastName,
        fullName: `${saved.teacher.firstName} ${saved.teacher.lastName}`,
        email: saved.teacher.email,
      },
      classLevels: saved.classLevels.map((level) => ({
        id: level.id,
        name: level.name,
      })),
    };
  }

  async remove(id: string, admin: SchoolAdmin): Promise<void> {
    const subject = await this.subjectRepository.findOne({
      where: { id, school: { id: admin.school.id } },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    await this.subjectRepository.delete(subject.id);
  }

  async getClassesForTeacher(teacherId: string) {
    const subjects = await this.subjectRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['classLevels', 'subjectCatalog'],
    });

    // Flatten and deduplicate class levels, but keep subject info
    const classLevelMap = new Map();
    for (const subject of subjects) {
      for (const level of subject.classLevels) {
        if (!classLevelMap.has(level.id)) {
          classLevelMap.set(level.id, {
            classLevel: { id: level.id, name: level.name },
            subject: { id: subject.id, name: subject.subjectCatalog.name },
          });
        }
      }
    }
    return Array.from(classLevelMap.values()) as {
      classLevel: { id: string; name: string };
      subject: { id: string; name: string };
    }[];
  }

  async getStudentsForGrading(
    classLevelId: string,
    subjectId: string,
    academicTermId: string,
  ) {
    // Fetch class level with students
    const classLevel = await this.classLevelRepository.findOne({
      where: { id: classLevelId },
      relations: ['students'],
    });
    if (!classLevel) throw new NotFoundException('Class level not found');

    // Fetch subject
    const subject = await this.subjectRepository.findOne({
      where: { id: subjectId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    // Fetch academic term and calendar
    const academicTerm = await this.academicTermRepository.findOne({
      where: { id: academicTermId },
      relations: ['academicCalendar'],
    });
    if (!academicTerm) throw new NotFoundException('Academic term not found');
    const academicCalendar = academicTerm.academicCalendar;

    // Fetch existing grades for this subject/class/term
    const grades = await this.studentGradeRepository.find({
      where: {
        subject: { id: subjectId },
        classLevel: { id: classLevelId },
        academicTerm: { id: academicTermId },
      },
      relations: ['student'],
    });
    const gradeMap = new Map(grades.map((g) => [g.student.id, g]));

    // Return students with their grade if available
    return classLevel.students.map((student) => ({
      student,
      grade: gradeMap.get(student.id) || null,
    }));
  }

  // async submitGrades({
  //   classLevelId,
  //   subjectId,
  //   academicTermId,
  //   teacherId,
  //   grades, // [{ studentId, classScore, examScore }]
  // }: {
  //   classLevelId: string;
  //   subjectId: string;
  //   academicTermId: string;
  //   teacherId: string;
  //   grades: Array<{ studentId: string; classScore: number; examScore: number }>;
  // }) {
  //   // Fetch required entities
  //   const classLevel = await this.classLevelRepository.findOne({
  //     where: { id: classLevelId },
  //   });
  //   if (!classLevel) throw new NotFoundException('Class level not found');
  //   const subject = await this.subjectRepository.findOne({
  //     where: { id: subjectId },
  //   });
  //   if (!subject) throw new NotFoundException('Subject not found');
  //   const academicTerm = await this.academicTermRepository.findOne({
  //     where: { id: academicTermId },
  //     relations: ['academicCalendar'],
  //   });
  //   if (!academicTerm) throw new NotFoundException('Academic term not found');
  //   const academicCalendar = academicTerm.academicCalendar;
  //   const teacher = await this.teacherRepository.findOne({
  //     where: { id: teacherId },
  //   });
  //   if (!teacher) throw new NotFoundException('Teacher not found');

  //   // Fetch grading system for the school
  //   const gradingSystem = await this.gradingSystemRepository.find({
  //     where: { school: { id: subject.school.id } },
  //   });
  //   if (!gradingSystem || gradingSystem.length === 0)
  //     throw new NotFoundException('Grading system not found');

  //   // Save or update grades
  //   const results = [];
  //   for (const g of grades) {
  //     const student = await this.studentRepository.findOne({
  //       where: { id: g.studentId },
  //     });
  //     if (!student) continue;
  //     const totalScore = g.classScore + g.examScore;
  //     // Find grade
  //     const gradeObj = gradingSystem.find(
  //       (gs) => totalScore >= gs.minRange && totalScore <= gs.maxRange,
  //     );
  //     const grade = gradeObj ? gradeObj.grade : 'N/A';
  //     // Upsert
  //     let studentGrade = await this.studentGradeRepository.findOne({
  //       where: {
  //         student: { id: student.id },
  //         subject: { id: subject.id },
  //         classLevel: { id: classLevel.id },
  //         academicTerm: { id: academicTerm.id },
  //       },
  //     });
  //     if (!studentGrade) {
  //       studentGrade = this.studentGradeRepository.create({
  //         student,
  //         subject,
  //         classLevel,
  //         academicTerm,
  //         academicCalendar,
  //         teacher,
  //         classScore: g.classScore,
  //         examScore: g.examScore,
  //         totalScore,
  //         grade,
  //       });
  //     } else {
  //       studentGrade.classScore = g.classScore;
  //       studentGrade.examScore = g.examScore;
  //       studentGrade.totalScore = totalScore;
  //       studentGrade.grade = grade;
  //     }
  //     await this.studentGradeRepository.save(studentGrade);
  //     results.push(studentGrade);
  //   }
  //   return results;
  // }
}
