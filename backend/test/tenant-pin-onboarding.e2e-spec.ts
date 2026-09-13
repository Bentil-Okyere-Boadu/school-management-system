import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { AdmissionStatus } from '../src/admission/admission.entity';

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
  admin: AuthResponse;
};

describe('Student/Teacher PIN onboarding (two schools)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let schoolRepository: Repository<School>;
  let superAdminToken: string;
  let schoolAdminRoleId: string;
  const createdSchoolIds: string[] = [];
  const createdSchemaNames: string[] = [];
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const teacherPins = new Map<string, string>();
  const studentPins = new Map<string, string>();

  const capturePin = (
    map: Map<string, string>,
    email: string,
    generatedId: string | undefined,
    pin: string,
  ) => {
    map.set(email.toLowerCase(), pin);
    if (generatedId) {
      map.set(generatedId.toLowerCase(), pin);
    }
  };

  const emailRetryMock = {
    retrySendInvitationEmail: jest.fn().mockResolvedValue(undefined),
    retrySendTeacherInvitation: jest.fn(
      async (
        teacher: { email: string },
        teacherId: string,
        pin: string,
      ) => {
        capturePin(teacherPins, teacher.email, teacherId, pin);
      },
    ),
    retrySendStudentInvitation: jest.fn(
      async (
        student: { email: string },
        studentId: string,
        pin: string,
      ) => {
        capturePin(studentPins, student.email, studentId, pin);
      },
    ),
  };

  const emailServiceMock = {
    sendParentInvitationEmail: jest.fn().mockResolvedValue(undefined),
    sendParentChildConfirmationEmail: jest.fn().mockResolvedValue(undefined),
    sendRegistrationConfirmationEmail: jest.fn().mockResolvedValue(undefined),
    sendAdmissionApplicationConfirmation: jest.fn().mockResolvedValue(undefined),
    sendAdmissionAcceptedEmail: jest.fn().mockResolvedValue(undefined),
    sendStudentInvitation: jest.fn(
      async (
        student: { email: string },
        studentId: string,
        pin: string,
      ) => {
        capturePin(studentPins, student.email, studentId, pin);
      },
    ),
    sendStudentPinReset: jest.fn(
      async (student: { email: string; studentId?: string }, pin: string) => {
        capturePin(studentPins, student.email, student.studentId, pin);
      },
    ),
    sendTeacherPinReset: jest.fn(
      async (teacher: { email: string; teacherId?: string }, pin: string) => {
        capturePin(teacherPins, teacher.email, teacher.teacherId, pin);
      },
    ),
  };

  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  function jwtPayload(token: string): Record<string, unknown> {
    return JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
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

  async function removeStaleArtifacts(): Promise<void> {
    const staleSchools: Array<{ id: string; schemaName: string | null }> =
      await dataSource.query(
        `SELECT id, "schemaName" FROM public.school WHERE name LIKE 'Phase PIN %'`,
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
         SELECT id::text FROM public.super_admin WHERE email LIKE 'phase-pin-super-%@example.com'
       )`,
    );
    await dataSource.query(
      `DELETE FROM public.super_admin WHERE email LIKE 'phase-pin-super-%@example.com'`,
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
        name: `Phase PIN School ${key.toUpperCase()} ${runId}`,
        calendlyUrl: `https://calendly.com/phase-pin-${key}-${runId}`,
      })
      .expect(201);

    expect(response.body.provisioningStatus).toBe(
      SchoolProvisioningStatus.Active,
    );
    const school = await schoolRepository.findOneByOrFail({
      id: response.body.id,
    });
    const schema = tenantSchemaName(school.id);
    createdSchoolIds.push(school.id);
    createdSchemaNames.push(schema);

    const invite = await request(app.getHttpServer())
      .post('/api/v1/invitations/admin')
      .set(bearer(superAdminToken))
      .send({
        firstName: `Admin${key.toUpperCase()}`,
        lastName: 'PinOnboard',
        email: adminEmail,
        roleId: schoolAdminRoleId,
        schoolId: school.id,
      })
      .expect(201);

    const platformInvitation = await dataSource.query(
      `SELECT token FROM public.platform_invitation WHERE id = $1`,
      [invite.body.id],
    );

    await request(app.getHttpServer())
      .post('/api/v1/invitations/complete-registration')
      .send({
        token: platformInvitation[0].token,
        password: adminPassword,
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/school-admin/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(201);

    return { key, school, schema, admin: login.body };
  }

  async function publicTableGone(table: string): Promise<void> {
    const rows = await dataSource.query(
      `SELECT to_regclass($1) AS table_name`,
      [`public.${table}`],
    );
    expect(rows[0].table_name).toBeNull();
  }

  beforeAll(async () => {
    process.env.JWT_SECRET ||= 'phase-pin-onboarding-test-secret';
    process.env.JWT_EXPIRES ||= '15m';
    process.env.THROTTLE_LIMIT = '10000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailRetryService)
      .useValue(emailRetryMock)
      .overrideProvider(EmailService)
      .useValue(emailServiceMock)
      .overrideProvider(APP_GUARD)
      .useValue({ canActivate: () => true })
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
    await removeStaleArtifacts();
    const roles = await ensureRoles();
    schoolAdminRoleId = roles.school_admin.id;

    const superAdminEmail = `phase-pin-super-${runId}@example.com`;
    const superAdminPassword = `Super-${runId}!`;
    await request(app.getHttpServer())
      .post('/api/v1/super-admin/auth/signup')
      .send({
        firstName: 'PhasePin',
        lastName: 'SuperAdmin',
        email: superAdminEmail,
        password: superAdminPassword,
      })
      .expect(201);

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
           SELECT id::text FROM public.super_admin WHERE email LIKE 'phase-pin-super-%@example.com'
         )`,
      );
      await dataSource.query(
        `DELETE FROM public.super_admin WHERE email LIKE 'phase-pin-super-%@example.com'`,
      );
    }
    await app?.close();
  });

  it('invites, logs in, resets PIN, and fail-closes across two schools', async () => {
    const schoolA = await createSchool(
      'a',
      `phase-pin-admin-a-${runId}@example.com`,
      `Admin-A-${runId}!`,
    );
    const schoolB = await createSchool(
      'b',
      `phase-pin-admin-b-${runId}@example.com`,
      `Admin-B-${runId}!`,
    );

    const inviteMembers = async (flow: SchoolFlow) => {
      const teacherEmail = `phase-pin-teacher-${flow.key}-${runId}@example.com`;
      const studentEmail = `phase-pin-student-${flow.key}-${runId}@example.com`;

      const teacherInvite = await request(app.getHttpServer())
        .post('/api/v1/invitations/teacher')
        .set(bearer(flow.admin.access_token))
        .send({
          firstName: `Teacher${flow.key.toUpperCase()}`,
          lastName: 'PinOnboard',
          email: teacherEmail,
        })
        .expect(201);

      const studentInvite = await request(app.getHttpServer())
        .post('/api/v1/invitations/student')
        .set(bearer(flow.admin.access_token))
        .send({
          firstName: `Student${flow.key.toUpperCase()}`,
          lastName: 'PinOnboard',
          email: studentEmail,
        })
        .expect(201);

      return {
        teacherEmail,
        teacherId: teacherInvite.body.id as string,
        teacherGeneratedId: teacherInvite.body.teacherId as string,
        teacherPin: teacherPins.get(teacherEmail) as string,
        studentEmail,
        studentRowId: studentInvite.body.id as string,
        studentGeneratedId: studentInvite.body.studentId as string,
        studentPin: studentPins.get(studentEmail) as string,
      };
    };

    const membersA = await inviteMembers(schoolA);
    const membersB = await inviteMembers(schoolB);
    expect(membersA.studentPin).toBeDefined();
    expect(membersB.studentPin).toBeDefined();
    expect(membersA.teacherPin).toBeDefined();
    expect(membersB.teacherPin).toBeDefined();

    await publicTableGone('student');
    await publicTableGone('teacher');

    const tenantStudentA = await dataSource.query(
      `SELECT id, email, status, "isInvitationAccepted" FROM "${schoolA.schema}".student WHERE email = $1`,
      [membersA.studentEmail],
    );
    const tenantStudentB = await dataSource.query(
      `SELECT id, email FROM "${schoolB.schema}".student WHERE email = $1`,
      [membersA.studentEmail],
    );
    expect(tenantStudentA).toHaveLength(1);
    expect(tenantStudentA[0].status).toBe('pending');
    expect(tenantStudentA[0].isInvitationAccepted).toBe(false);
    expect(tenantStudentB).toHaveLength(0);

    const directoryA = await dataSource.query(
      `SELECT "loginKey" FROM public.tenant_directory
       WHERE "schoolId" = $1 AND "userType" = 'student' AND "tenantUserId" = $2`,
      [schoolA.school.id, membersA.studentRowId],
    );
    expect(directoryA.map((row: { loginKey: string }) => row.loginKey)).toEqual(
      expect.arrayContaining([
        membersA.studentEmail.toLowerCase(),
        membersA.studentGeneratedId.toLowerCase(),
      ]),
    );

    const hashBeforeResend = await dataSource.query(
      `SELECT password FROM "${schoolA.schema}".student WHERE id = $1`,
      [membersA.studentRowId],
    );
    const hashBBeforeResend = await dataSource.query(
      `SELECT password FROM "${schoolB.schema}".student WHERE id = $1`,
      [membersB.studentRowId],
    );

    await request(app.getHttpServer())
      .post(`/api/v1/invitations/student/resend/${membersA.studentRowId}`)
      .set(bearer(schoolA.admin.access_token))
      .expect(201);
    const resentPin = studentPins.get(membersA.studentEmail);
    expect(resentPin).toBeDefined();
    expect(resentPin).not.toBe(membersA.studentPin);

    const hashAfterResend = await dataSource.query(
      `SELECT password FROM "${schoolA.schema}".student WHERE id = $1`,
      [membersA.studentRowId],
    );
    const hashBAfterResend = await dataSource.query(
      `SELECT password FROM "${schoolB.schema}".student WHERE id = $1`,
      [membersB.studentRowId],
    );
    expect(hashAfterResend[0].password).not.toBe(hashBeforeResend[0].password);
    expect(hashBAfterResend[0].password).toBe(hashBBeforeResend[0].password);
    membersA.studentPin = resentPin as string;

    const loginStudent = async (
      identifier: string,
      pin: string,
      expectedSchoolId: string,
      expectedRowId: string,
    ) => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/student/login')
        .send({ identifier, pin })
        .expect(201);
      expect(jwtPayload(login.body.access_token).schoolId).toBe(
        expectedSchoolId,
      );
      expect(login.body.id).toBe(expectedRowId);
      return login.body as AuthResponse;
    };

    const loginTeacher = async (
      identifier: string,
      pin: string,
      expectedSchoolId: string,
      expectedRowId: string,
    ) => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/teacher/login')
        .send({ identifier, pin })
        .expect(201);
      expect(jwtPayload(login.body.access_token).schoolId).toBe(
        expectedSchoolId,
      );
      expect(login.body.id).toBe(expectedRowId);
      return login.body as AuthResponse;
    };

    const studentAuthA = await loginStudent(
      membersA.studentGeneratedId,
      membersA.studentPin,
      schoolA.school.id,
      membersA.studentRowId,
    );
    const studentAuthB = await loginStudent(
      membersB.studentEmail,
      membersB.studentPin,
      schoolB.school.id,
      membersB.studentRowId,
    );
    const teacherAuthA = await loginTeacher(
      membersA.teacherGeneratedId,
      membersA.teacherPin,
      schoolA.school.id,
      membersA.teacherId,
    );
    await loginTeacher(
      membersB.teacherEmail,
      membersB.teacherPin,
      schoolB.school.id,
      membersB.teacherId,
    );

    const activatedA = await dataSource.query(
      `SELECT status, "isInvitationAccepted" FROM "${schoolA.schema}".student WHERE id = $1`,
      [membersA.studentRowId],
    );
    const stillPendingB = await dataSource.query(
      `SELECT status FROM "${schoolB.schema}".student WHERE id = $1`,
      [membersB.studentRowId],
    );
    expect(activatedA[0].status).toBe('active');
    expect(activatedA[0].isInvitationAccepted).toBe(true);
    expect(stillPendingB[0].status).toBe('active');

    const meA = await request(app.getHttpServer())
      .get('/api/v1/student/me')
      .set(bearer(studentAuthA.access_token))
      .expect(200);
    expect(meA.body.id).toBe(membersA.studentRowId);
    expect(JSON.stringify(meA.body)).not.toContain(membersB.studentRowId);

    const teacherMeA = await request(app.getHttpServer())
      .get('/api/v1/teacher/me')
      .set(bearer(teacherAuthA.access_token))
      .expect(200);
    expect(teacherMeA.body.id).toBe(membersA.teacherId);
    expect(JSON.stringify(teacherMeA.body)).not.toContain(membersB.teacherId);

    await request(app.getHttpServer())
      .post('/api/v1/teacher/login')
      .send({ identifier: membersB.teacherGeneratedId, pin: membersA.teacherPin })
      .expect(401);

    const hashBBeforeForgot = await dataSource.query(
      `SELECT password FROM "${schoolB.schema}".student WHERE id = $1`,
      [membersB.studentRowId],
    );
    await request(app.getHttpServer())
      .post('/api/v1/student/forgot-password')
      .send({ identifier: membersA.studentGeneratedId })
      .expect(201);
    const resetPinA = studentPins.get(membersA.studentEmail);
    expect(resetPinA).toBeDefined();
    const hashBAfterForgot = await dataSource.query(
      `SELECT password FROM "${schoolB.schema}".student WHERE id = $1`,
      [membersB.studentRowId],
    );
    expect(hashBAfterForgot[0].password).toBe(hashBBeforeForgot[0].password);
    const hashAAfterForgot = await dataSource.query(
      `SELECT password FROM "${schoolA.schema}".student WHERE id = $1`,
      [membersA.studentRowId],
    );
    expect(hashAAfterForgot[0].password).not.toBe(hashBAfterForgot[0].password);

    const sharedEmail = `phase-pin-shared-${runId}@example.com`;
    const sharedA = await request(app.getHttpServer())
      .post('/api/v1/invitations/student')
      .set(bearer(schoolA.admin.access_token))
      .send({
        firstName: 'SharedA',
        lastName: 'PinOnboard',
        email: sharedEmail,
      })
      .expect(201);
    const sharedB = await request(app.getHttpServer())
      .post('/api/v1/invitations/student')
      .set(bearer(schoolB.admin.access_token))
      .send({
        firstName: 'SharedB',
        lastName: 'PinOnboard',
        email: sharedEmail,
      })
      .expect(201);
    const sharedPinA = studentPins.get(sharedEmail);
    expect(sharedPinA).toBeDefined();
    const hashSharedA = await dataSource.query(
      `SELECT password FROM "${schoolA.schema}".student WHERE id = $1`,
      [sharedA.body.id],
    );
    const hashSharedB = await dataSource.query(
      `SELECT password FROM "${schoolB.schema}".student WHERE id = $1`,
      [sharedB.body.id],
    );

    await request(app.getHttpServer())
      .post('/api/v1/student/forgot-password')
      .send({ identifier: sharedEmail })
      .expect(404);
    expect(
      (
        await dataSource.query(
          `SELECT password FROM "${schoolA.schema}".student WHERE id = $1`,
          [sharedA.body.id],
        )
      )[0].password,
    ).toBe(hashSharedA[0].password);
    expect(
      (
        await dataSource.query(
          `SELECT password FROM "${schoolB.schema}".student WHERE id = $1`,
          [sharedB.body.id],
        )
      )[0].password,
    ).toBe(hashSharedB[0].password);

    await loginStudent(
      sharedA.body.studentId,
      studentPins.get(String(sharedA.body.studentId).toLowerCase()) as string,
      schoolA.school.id,
      sharedA.body.id,
    );
    await loginStudent(
      sharedB.body.studentId,
      studentPins.get(String(sharedB.body.studentId).toLowerCase()) as string,
      schoolB.school.id,
      sharedB.body.id,
    );

    const admissionEmail = `phase-pin-admission-${runId}@example.com`;
    const createdAdmission = await request(app.getHttpServer())
      .post('/api/v1/admissions')
      .send({
        schoolId: schoolA.school.id,
        studentFirstName: 'Admit',
        studentLastName: 'PinOnboard',
        studentEmail: admissionEmail,
        guardians: [],
        hasPreviousSchool: false,
      })
      .expect(201);
    expect(createdAdmission.body.applicationId).toBeDefined();

    await request(app.getHttpServer())
      .patch(
        `/api/v1/school-admin/admissions/${createdAdmission.body.applicationId}/status`,
      )
      .set(bearer(schoolA.admin.access_token))
      .send({ status: AdmissionStatus.ACCEPTED })
      .expect(200);

    const admitted = await dataSource.query(
      `SELECT id, "studentId", status FROM "${schoolA.schema}".student WHERE email = $1`,
      [admissionEmail],
    );
    expect(admitted).toHaveLength(1);
    const admittedDirectory = await dataSource.query(
      `SELECT "loginKey" FROM public.tenant_directory
       WHERE "schoolId" = $1 AND "userType" = 'student' AND "tenantUserId" = $2`,
      [schoolA.school.id, admitted[0].id],
    );
    expect(
      admittedDirectory.map((row: { loginKey: string }) => row.loginKey),
    ).toEqual(
      expect.arrayContaining([
        admissionEmail.toLowerCase(),
        String(admitted[0].studentId).toLowerCase(),
      ]),
    );
    const admissionPin = studentPins.get(admissionEmail);
    expect(admissionPin).toBeDefined();
    await loginStudent(
      admitted[0].studentId,
      admissionPin as string,
      schoolA.school.id,
      admitted[0].id,
    );

    await request(app.getHttpServer())
      .post('/api/v1/invitations/forgot-pin')
      .send({ email: membersA.studentEmail })
      .expect(404);
  });
});
