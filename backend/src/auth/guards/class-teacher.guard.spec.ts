import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { IsClassTeacherGuard } from './class-teacher.guard';
import { TeacherService } from 'src/teacher/teacher.service';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';

describe('IsClassTeacherGuard', () => {
  const teacherService = {
    checkIfClassTeacher: jest.fn(),
  } as unknown as TeacherService;

  const tenantConnection = {
    runForSchoolId: jest.fn(
      async (_schoolId: string, fn: () => Promise<unknown>) => fn(),
    ),
  } as unknown as TenantConnectionService;

  const guard = new IsClassTeacherGuard(teacherService, tenantConnection);

  function buildContext(params: Record<string, string>, user: object) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          params,
          body: {},
          user,
        }),
      }),
    } as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checks class teacher within tenant context', async () => {
    (teacherService.checkIfClassTeacher as jest.Mock).mockResolvedValue({
      isClassTeacher: true,
    });

    const result = await guard.canActivate(
      buildContext(
        { classLevelId: 'class-1' },
        { id: 'teacher-1', schoolId: 'school-1' },
      ),
    );

    expect(result).toBe(true);
    expect(tenantConnection.runForSchoolId).toHaveBeenCalledWith(
      'school-1',
      expect.any(Function),
    );
    expect(teacherService.checkIfClassTeacher).toHaveBeenCalledWith(
      'teacher-1',
      'class-1',
      undefined,
    );
  });

  it('rejects when teacher is not class teacher', async () => {
    (teacherService.checkIfClassTeacher as jest.Mock).mockResolvedValue({
      isClassTeacher: false,
    });

    await expect(
      guard.canActivate(
        buildContext(
          { classLevelId: 'class-1' },
          { id: 'teacher-1', schoolId: 'school-1' },
        ),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when schoolId is missing from user', async () => {
    await expect(
      guard.canActivate(
        buildContext({ classLevelId: 'class-1' }, { id: 'teacher-1' }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tenantConnection.runForSchoolId).not.toHaveBeenCalled();
  });
});
