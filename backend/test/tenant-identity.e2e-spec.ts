import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { EmailRetryService } from '../src/common/services/email-retry.service';
import { EmailService } from '../src/common/services/email.service';
import { Role } from '../src/role/role.entity';
import { School } from '../src/school/school.entity';
import { SchoolProvisioningStatus } from '../src/tenant/school-provisioning-status';
import { tenantSchemaName } from '../src/tenant/tenant-schema.util';

jest.setTimeout(15 * 60 * 1000);

type AuthResponse = {
  access_token: string;
  refresh_token: string;
  id: string;
};

type SchoolFlow = {
  key: 'a' | 'b';
  school: School;
  schema: string;
  adminEmail: string;
  adminPassword: string;
  admin: AuthResponse;
  teacherEmail: string;
  teacherId: string;
  teacher: AuthResponse;
  studentId: string;
  parentEmail: string;
  parentId: string;
  parent: AuthResponse;
  classLevelId: string;
};

describe('Phase 3 identity HTTP flow (two schools)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let schoolRepository: Repository<School>;
  let superAdminToken: string;
  let schoolAdminRoleId: string;
  let inactiveSchoolId: string | undefined;
  const createdSchoolIds: string[] = [];
  const createdSchemaNames: string[] = [];
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const teacherPins = new Map<string, string>();
  const studentPins = new Map<string, string>();
  const parentTokens = new Map<string, string>();

  const emailRetryMock = {
    retrySendInvitationEmail: jest.fn().mockResolvedValue(undefined),
    retrySendTeacherInvitation: jest.fn(
      async (teacher: { email: string }, _teacherId: string, pin: string) => {
        teacherPins.set(teacher.email.toLowerCase(), pin);
      },
    ),
    retrySendStudentInvitation: jest.fn(
      async (student: { email: string }, _studentId: string, pin: string) => {
        studentPins.set(student.email.toLowerCase(), pin);
      },
    ),
  };

  const emailServiceMock = {
    sendParentInvitationEmail: jest.fn(
      async (parent: { email: string; invitationToken: string }) => {
        parentTokens.set(parent.email.toLowerCase(), parent.invitationToken);
      },
    ),
    sendParentChildConfirmationEmail: jest.fn().mockResolvedValue(undefined),
    sendRegistrationConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  };

  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  function jwtPayload(token: string): Record<string, unknown> {
    return JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
  }

  function records(body: unknown): Array<{ id?: string }> {
    if (Array.isArray(body)) {
      return body as Array<{ id?: string }>;
    }
    const value = body as {
      data?: Array<{ id?: string }> | { data?: Array<{ id?: string }> };
    };
    if (Array.isArray(value?.data)) {
      return value.data;
    }
    return value?.data?.data ?? [];
  }

  async function ensureRoles(): Promise<Record<string, Role>> {
    const repository = dataSource.getRepository(Role);
    const roles: Record<string, Role> = {};
    for (const name of [
      'super_admin',
      'school_admin',
      'teacher',
      'student',
      'parent',
    ]) {
      let role = await repository.findOne({ where: { name } });
      if (!role) {
        role = await repository.save(
          repository.create({
            name,
            label: name
              .split('_')
              .map((part) => part[0].toUpperCase() + part.slice(1))
              .join(' '),
          }),
        );
      }
      roles[name] = role;
    }
    return roles;
  }

  async function removeStalePhase3Artifacts(): Promise<void> {
    const staleSchools: Array<{ id: string; schemaName: string | null }> =
      await dataSource.query(
        `SELECT id, "schemaName" FROM public.school WHERE name LIKE 'Phase 3 %'`,
      );
    const staleIds = staleSchools.map((school) => school.id);
    for (const school of staleSchools) {
      if (school.schemaName?.startsWith('tenant_')) {
        await dataSource.query(
          `DROP SCHEMA IF EXISTS "${school.schemaName}" CASCADE`,
        );
      }
    }
    if (staleIds.length) {
      await dataSource.query(
        `DELETE FROM public.refresh_token WHERE "schoolId" = ANY($1::uuid[])`,
        [staleIds],
      );
      await dataSource.query(
        `DELETE FROM public.tenant_directory WHERE "schoolId" = ANY($1::uuid[])`,
        [staleIds],
      );
      await dataSource.query(
        `DELETE FROM public.platform_invitation WHERE "schoolId" = ANY($1::uuid[])`,
        [staleIds],
      );
      await dataSource.query(
        `DELETE FROM public.school WHERE id = ANY($1::uuid[])`,
        [staleIds],
      );
    }
    await dataSource.query(
      `DELETE FROM public.refresh_token
       WHERE "userType" = 'super_admin'
       AND "userId" IN (
         SELECT id::text FROM public.super_admin WHERE email LIKE 'phase3-super-%@example.com'
       )`,
    );
    await dataSource.query(
      `DELETE FROM public.super_admin WHERE email LIKE 'phase3-super-%@example.com'`,
    );
  }

  async function createSchool(
    key: 'a' | 'b',
    adminEmail: string,
    adminPassword: string,
  ): Promise<SchoolFlow> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/super-admin/schools')
      .set(bearer(superAdminToken))
      .send({
        name: `Phase 3 School ${key.toUpperCase()} ${runId}`,
        calendlyUrl: `https://calendly.com/phase-3-${key}-${runId}`,
      })
      .expect(201);

    expect(response.body.provisioningStatus).toBe(
      SchoolProvisioningStatus.Active,
    );
    expect(response.body.schemaName).toBe(tenantSchemaName(response.body.id));

    const school = await schoolRepository.findOneByOrFail({
      id: response.body.id,
    });
    const schema = tenantSchemaName(school.id);
    createdSchoolIds.push(school.id);
    createdSchemaNames.push(schema);

    const beforeInvite = await dataSource.query(
      `SELECT COUNT(*)::int AS count FROM "${schema}".school_admin`,
    );
    expect(beforeInvite[0].count).toBe(0);

    const invite = await request(app.getHttpServer())
      .post('/api/v1/invitations/admin')
      .set(bearer(superAdminToken))
      .send({
        firstName: `Admin${key.toUpperCase()}`,
        lastName: 'PhaseThree',
        email: adminEmail,
        roleId: schoolAdminRoleId,
        schoolId: school.id,
      })
      .expect(201);

    expect(invite.body.schoolId).toBe(school.id);
    expect(invite.body.accepted).toBe(false);

    const platformInvitation = await dataSource.query(
      `SELECT id, token, "schoolId", accepted
       FROM public.platform_invitation WHERE id = $1`,
      [invite.body.id],
    );
    expect(platformInvitation).toHaveLength(1);
    expect(platformInvitation[0].schoolId).toBe(school.id);
    expect(platformInvitation[0].accepted).toBe(false);

    const tenantInvitationTable = await dataSource.query(
      `SELECT to_regclass($1) AS table_name`,
      [`"${schema}".platform_invitation`],
    );
    expect(tenantInvitationTable[0].table_name).toBeNull();

    const afterInvite = await dataSource.query(
      `SELECT COUNT(*)::int AS count FROM "${schema}".school_admin`,
    );
    expect(afterInvite[0].count).toBe(0);

    const accepted = await request(app.getHttpServer())
      .post('/api/v1/invitations/complete-registration')
      .send({
        token: platformInvitation[0].token,
        password: adminPassword,
      })
      .expect(201);

    expect(jwtPayload(accepted.body.access_token).schoolId).toBe(school.id);

    const tenantAdmin = await dataSource.query(
      `SELECT id, email, status FROM "${schema}".school_admin WHERE email = $1`,
      [adminEmail],
    );
    expect(tenantAdmin).toHaveLength(1);
    expect(tenantAdmin[0].status).toBe('active');

    const tenantProfile = await dataSource.query(
      `SELECT id, email FROM "${schema}".profile WHERE email = $1`,
      [adminEmail],
    );
    expect(tenantProfile).toHaveLength(1);

    const invitationAfterAccept = await dataSource.query(
      `SELECT accepted FROM public.platform_invitation WHERE id = $1`,
      [invite.body.id],
    );
    expect(invitationAfterAccept[0].accepted).toBe(true);

    const directory = await dataSource.query(
      `SELECT "schoolId", "tenantUserId" FROM public.tenant_directory
       WHERE "loginKey" = $1 AND "userType" = 'school_admin'`,
      [adminEmail],
    );
    expect(directory).toEqual([
      { schoolId: school.id, tenantUserId: tenantAdmin[0].id },
    ]);

    const login = await request(app.getHttpServer())
      .post('/api/v1/school-admin/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(201);
    expect(jwtPayload(login.body.access_token).schoolId).toBe(school.id);

    const adminMe = await request(app.getHttpServer())
      .get('/api/v1/school-admin/me')
      .set(bearer(login.body.access_token))
      .expect(200);
    expect(adminMe.body.id).toBe(tenantAdmin[0].id);
    expect(adminMe.body.school.id).toBe(school.id);

    const teacherEmail = `phase3-teacher-${key}-${runId}@example.com`;
    const teacherInvite = await request(app.getHttpServer())
      .post('/api/v1/invitations/teacher')
      .set(bearer(login.body.access_token))
      .send({
        firstName: `Teacher${key.toUpperCase()}`,
        lastName: 'PhaseThree',
        email: teacherEmail,
      })
      .expect(201);
    const teacherPin = teacherPins.get(teacherEmail);
    expect(teacherPin).toBeDefined();

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v1/teacher/login')
      .send({ identifier: teacherEmail, pin: teacherPin })
      .expect(201);
    expect(jwtPayload(teacherLogin.body.access_token).schoolId).toBe(school.id);

    const teacherMe = await request(app.getHttpServer())
      .get('/api/v1/teacher/me')
      .set(bearer(teacherLogin.body.access_token))
      .expect(200);
    expect(teacherMe.body.id).toBe(teacherInvite.body.id);
    expect(teacherMe.body.school.id).toBe(school.id);

    const studentEmail = `phase3-student-${key}-${runId}@example.com`;
    const studentInvite = await request(app.getHttpServer())
      .post('/api/v1/invitations/student')
      .set(bearer(login.body.access_token))
      .send({
        firstName: `Student${key.toUpperCase()}`,
        lastName: 'PhaseThree',
        email: studentEmail,
      })
      .expect(201);
    expect(studentPins.get(studentEmail)).toBeDefined();

    const parentEmail = `phase3-parent-${key}-${runId}@example.com`;
    const parentCreate = await request(app.getHttpServer())
      .post(`/api/v1/school-admin/students/${studentInvite.body.id}/parents`)
      .set(bearer(login.body.access_token))
      .send({
        firstName: `Parent${key.toUpperCase()}`,
        lastName: 'PhaseThree',
        email: parentEmail,
        relationship: 'Parent',
      })
      .expect(201);
    const parentToken = parentTokens.get(parentEmail);
    expect(parentToken).toBeDefined();
    const parentPassword = `Parent-${key}-${runId}!`;

    await request(app.getHttpServer())
      .post('/api/v1/invitations/complete-registration')
      .send({ token: parentToken, password: parentPassword })
      .expect(201);

    const parentLogin = await request(app.getHttpServer())
      .post('/api/v1/parent/login')
      .send({ email: parentEmail, password: parentPassword })
      .expect(201);
    expect(jwtPayload(parentLogin.body.access_token).schoolId).toBe(school.id);

    const parentMe = await request(app.getHttpServer())
      .get('/api/v1/parent/me')
      .set(bearer(parentLogin.body.access_token))
      .expect(200);
    expect(parentMe.body.id).toBe(parentCreate.body.id);
    expect(parentMe.body.school.id).toBe(school.id);
    const childIds = records(parentMe.body.children ?? parentMe.body).map(
      (child) => child.id,
    );
    if (childIds.length) {
      expect(childIds).toContain(studentInvite.body.id);
    }

    const parentDirectory = await dataSource.query(
      `SELECT "schoolId", "tenantUserId" FROM public.tenant_directory
       WHERE "loginKey" = $1 AND "userType" = 'parent'`,
      [parentEmail],
    );
    expect(parentDirectory).toEqual([
      { schoolId: school.id, tenantUserId: parentCreate.body.id },
    ]);

    const classLevel = await request(app.getHttpServer())
      .post('/api/v1/class-level')
      .set(bearer(login.body.access_token))
      .send({
        name: `Phase 3 Class ${key.toUpperCase()}`,
        description: `Tenant ${key.toUpperCase()} original`,
        classTeacherId: teacherInvite.body.id,
        teacherIds: [teacherInvite.body.id],
        studentIds: [studentInvite.body.id],
      })
      .expect(201);

    return {
      key,
      school,
      schema,
      adminEmail,
      adminPassword,
      admin: login.body,
      teacherEmail,
      teacherId: teacherInvite.body.id,
      teacher: teacherLogin.body,
      studentId: studentInvite.body.id,
      parentEmail,
      parentId: parentCreate.body.id,
      parent: parentLogin.body,
      classLevelId: classLevel.body.id,
    };
  }

  beforeAll(async () => {
    process.env.JWT_SECRET ||= 'phase-3-identity-test-secret';
    process.env.JWT_EXPIRES ||= '15m';
    process.env.THROTTLE_LIMIT = '10000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailRetryService)
      .useValue(emailRetryMock)
      .overrideProvider(EmailService)
      .useValue(emailServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    schoolRepository = dataSource.getRepository(School);
    await removeStalePhase3Artifacts();
    const roles = await ensureRoles();
    schoolAdminRoleId = roles.school_admin.id;

    const superAdminEmail = `phase3-super-${runId}@example.com`;
    const superAdminPassword = `Super-${runId}!`;
    const signup = await request(app.getHttpServer())
      .post('/api/v1/super-admin/auth/signup')
      .send({
        firstName: 'PhaseThree',
        lastName: 'SuperAdmin',
        email: superAdminEmail,
        password: superAdminPassword,
      })
      .expect(201);
    expect(jwtPayload(signup.body.access_token).schoolId).toBeUndefined();

    const login = await request(app.getHttpServer())
      .post('/api/v1/super-admin/auth/login')
      .send({ email: superAdminEmail, password: superAdminPassword })
      .expect(201);
    superAdminToken = login.body.access_token;
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      for (const schema of createdSchemaNames) {
        await dataSource.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      }
      if (inactiveSchoolId) {
        createdSchoolIds.push(inactiveSchoolId);
      }
      if (createdSchoolIds.length) {
        await dataSource.query(
          `DELETE FROM public.refresh_token WHERE "schoolId" = ANY($1::uuid[])`,
          [createdSchoolIds],
        );
        await dataSource.query(
          `DELETE FROM public.tenant_directory WHERE "schoolId" = ANY($1::uuid[])`,
          [createdSchoolIds],
        );
        await dataSource.query(
          `DELETE FROM public.platform_invitation WHERE "schoolId" = ANY($1::uuid[])`,
          [createdSchoolIds],
        );
        await dataSource.query(
          `DELETE FROM public.school WHERE id = ANY($1::uuid[])`,
          [createdSchoolIds],
        );
      }
      await dataSource.query(
        `DELETE FROM public.refresh_token WHERE "userType" = 'super_admin'
         AND "userId" IN (
           SELECT id::text FROM public.super_admin WHERE email LIKE $1
         )`,
        [`phase3-super-%-${runId}@example.com`],
      );
      await dataSource.query(
        `DELETE FROM public.super_admin WHERE email = $1`,
        [`phase3-super-${runId}@example.com`],
      );
    }
    if (app) {
      await app.close();
    }
  });

  it('onboards and isolates Admin, Teacher, and Parent for both schools', async () => {
    const inactive = await schoolRepository.save(
      schoolRepository.create({
        name: `Phase 3 Not Active ${runId}`,
        calendlyUrl: `https://calendly.com/phase-3-inactive-${runId}`,
        provisioningStatus: SchoolProvisioningStatus.Provisioning,
      }),
    );
    inactiveSchoolId = inactive.id;
    await request(app.getHttpServer())
      .post('/api/v1/invitations/admin')
      .set(bearer(superAdminToken))
      .send({
        firstName: 'Too',
        lastName: 'Early',
        email: `phase3-too-early-${runId}@example.com`,
        roleId: schoolAdminRoleId,
        schoolId: inactive.id,
      })
      .expect(400);

    const flowA = await createSchool(
      'a',
      `phase3-admin-a-${runId}@example.com`,
      `Admin-A-${runId}!`,
    );
    const flowB = await createSchool(
      'b',
      `phase3-admin-b-${runId}@example.com`,
      `Admin-B-${runId}!`,
    );

    for (const [current, other] of [
      [flowA, flowB],
      [flowB, flowA],
    ] as const) {
      const currentAdmin = bearer(current.admin.access_token);

      await request(app.getHttpServer())
        .get(`/api/v1/class-level/${other.classLevelId}`)
        .set(currentAdmin)
        .expect(404);

      await request(app.getHttpServer())
        .patch(`/api/v1/class-level/${other.classLevelId}`)
        .set(currentAdmin)
        .send({ name: `Hacked by ${current.key}` })
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/api/v1/class-level/${other.classLevelId}`)
        .set(currentAdmin)
        .expect(404);

      const otherClass = await dataSource.query(
        `SELECT name, description FROM "${other.schema}".class_level WHERE id = $1`,
        [other.classLevelId],
      );
      expect(otherClass).toEqual([
        {
          name: `Phase 3 Class ${other.key.toUpperCase()}`,
          description: `Tenant ${other.key.toUpperCase()} original`,
        },
      ]);

      await request(app.getHttpServer())
        .get(`/api/v1/school-admin/users/${other.teacherId}`)
        .set(currentAdmin)
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/api/v1/school-admin/users/${other.teacherId}`)
        .set(currentAdmin)
        .expect(404);

      const otherTeacher = await dataSource.query(
        `SELECT id FROM "${other.schema}".teacher WHERE id = $1`,
        [other.teacherId],
      );
      expect(otherTeacher).toHaveLength(1);

      await request(app.getHttpServer())
        .patch(
          `/api/v1/school-admin/students/${other.studentId}/parents/${other.parentId}`,
        )
        .set(currentAdmin)
        .send({ firstName: 'CrossTenantChange' })
        .expect(404);

      await request(app.getHttpServer())
        .delete(
          `/api/v1/school-admin/students/${other.studentId}/parents/${other.parentId}`,
        )
        .set(currentAdmin)
        .expect(404);

      const otherParent = await dataSource.query(
        `SELECT "firstName" FROM "${other.schema}".parent WHERE id = $1`,
        [other.parentId],
      );
      expect(otherParent).toEqual([
        { firstName: `Parent${other.key.toUpperCase()}` },
      ]);

      const classes = await request(app.getHttpServer())
        .get('/api/v1/class-level')
        .set(currentAdmin)
        .expect(200);
      expect(records(classes.body).map((item) => item.id)).toContain(
        current.classLevelId,
      );
      expect(records(classes.body).map((item) => item.id)).not.toContain(
        other.classLevelId,
      );

      const users = await request(app.getHttpServer())
        .get('/api/v1/school-admin/users?limit=100')
        .set(currentAdmin)
        .expect(200);
      const userIds = records(users.body).map((item) => item.id);
      expect(userIds).toEqual(
        expect.arrayContaining([current.teacherId, current.studentId]),
      );
      expect(userIds).not.toEqual(
        expect.arrayContaining([other.teacherId, other.studentId]),
      );

      const students = await request(app.getHttpServer())
        .get('/api/v1/school-admin/students?limit=100')
        .set(currentAdmin)
        .expect(200);
      const studentIds = records(students.body).map((item) => item.id);
      expect(studentIds).toContain(current.studentId);
      expect(studentIds).not.toContain(other.studentId);

      await request(app.getHttpServer())
        .get(`/api/v1/teacher/users/${other.studentId}`)
        .set(bearer(current.teacher.access_token))
        .expect(404);

      const teacherStudents = await request(app.getHttpServer())
        .get('/api/v1/teacher/students?limit=100')
        .set(bearer(current.teacher.access_token))
        .expect(200);
      const teacherStudentIds = records(teacherStudents.body).map(
        (item) => item.id,
      );
      expect(teacherStudentIds).toContain(current.studentId);
      expect(teacherStudentIds).not.toContain(other.studentId);

      await request(app.getHttpServer())
        .get(`/api/v1/parent/children/${other.studentId}/attendance`)
        .set(bearer(current.parent.access_token))
        .expect((response) => {
          if (![403, 404].includes(response.status)) {
            throw new Error(
              `Expected cross-school parent read rejection, got ${response.status}`,
            );
          }
        });

      const parentMe = await request(app.getHttpServer())
        .get('/api/v1/parent/me')
        .set(bearer(current.parent.access_token))
        .expect(200);
      expect(JSON.stringify(parentMe.body)).toContain(current.studentId);
      expect(JSON.stringify(parentMe.body)).not.toContain(other.studentId);
    }
  });
});
