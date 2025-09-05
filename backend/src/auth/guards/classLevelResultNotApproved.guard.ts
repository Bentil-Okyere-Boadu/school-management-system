import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassLevelResultApproval } from 'src/class-level/class-level-result-approval.entity';
import { StudentGrade } from 'src/subject/student-grade.entity';

@Injectable()
export class ClassLevelResultNotApprovedGuard implements CanActivate {
  constructor(
    @InjectRepository(ClassLevelResultApproval)
    private classLevelResultApprovalRepository: Repository<ClassLevelResultApproval>,
    @InjectRepository(StudentGrade)
    private studentGradeRepository: Repository<StudentGrade>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Merge params, query, and body
    let { classLevelId, academicTermId, studentId, termId } = {
      ...request.params,
      ...request.query,
      ...request.body,
    };

    // Support for endpoints with studentId and termId only
    if ((!classLevelId || !academicTermId) && studentId && termId) {
      academicTermId = termId;
      // Find the student's classLevel for this term
      const grade = await this.studentGradeRepository.findOne({
        where: {
          student: { id: studentId },
          academicTerm: { id: academicTermId },
        },
        relations: ['classLevel'],
      });
      if (!grade) {
        throw new ForbiddenException(
          'Could not determine class level for student and term.',
        );
      }
      classLevelId = grade.classLevel.id;
    }

    if (!classLevelId || !academicTermId) {
      throw new ForbiddenException(
        'classLevelId and academicTermId are required',
      );
    }

    const approval = await this.classLevelResultApprovalRepository.findOne({
      where: {
        classLevel: { id: classLevelId },
        academicTerm: { id: academicTermId },
      },
    });

    // Check if school admin has approved - if so, no modifications allowed
    if (approval?.schoolAdminApproved) {
      throw new ForbiddenException(
        'The results for this class and academic term have been approved by school admin. Only school admin can modify them.',
      );
    }

    // Check if class teacher has approved - if so, no modifications allowed unless school admin unapproves
    if (approval?.approved) {
      throw new ForbiddenException(
        'The results for this class and academic term have already been approved by class teacher. Please contact your administrator if you need them to be unlocked.',
      );
    }

    return true;
  }
}
