import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
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
  adminId: string;
  studentId: string;
  parentId: string;
};

describe('Parent & School Admin pre-login hardening (two schools)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let schoolRepository: Repository<School>;
  let superAdminToken: string;
  let schoolAdminRoleId: string;
  const createdSchoolIds: string[] = [];
  const createdSchemaNames: string[] = [];
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const parentInvitationTokens = new Map<string, string>();
  const parentResetTokens = new Map<string, string>();
  const adminResetTokens = new Map<string, string>();
  const childConfirmTokens = new Map<string, string>();

  const emailRetryMock = {
    retrySendInvitationEmail: jest.fn().mockResolvedValue(undefined),
    retrySendTeacherInvitation: jest.fn().mockResolvedValue(undefined),
    retrySendStudentInvitation: jest.fn().mockResolvedValue(undefined),
  };

  const emailServiceMock = {
    sendParentInvitationEmail: jest.fn(
      async (parent: { email: string; invitationToken: string }) => {
        parentInvitationTokens.set(
          parent.email.toLowerCase(),
          parent.invitationToken,
        );
      },
    ),
    sendParentChildConfirmationEmail: jest.fn(
      async (
        parent: { email: string },
        _student: unknown,
        token: string,
      ) => {
        childConfirmTokens.set(`${parent.email.toLowerCase()}:${token}`, token);
      },
    ),
    sendPasswordResetEmail: jest.fn(
      async (email: string, resetToken: string) => {
        const normalized = email.toLowerCase();
        if (normalized.includes('admin')) {
          adminResetTokens.set(normalized, resetToken);
        } else {
          parentResetTokens.set(normalized, resetToken);
        }
      },
    ),
    sendRegistrationConfirmationEmail: jest.fn().mockResolvedValue(undefined),
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
        `SELECT id, "schemaName" FROM public.school WHERE name LIKE 'Phase 46 %'`,
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
        `DELETE FROM public.platform_prelogin_token WHERE "schoolId" = ANY($1::uuid[])`,
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
         SELECT id::text FROM public.super_admin WHERE email LIKE 'phase46-super-%@example.com'
       )`,
    );
    await dataSource.query(
      `DELETE FROM public.super_admin WHERE email LIKE 'phase46-super-%@example.com'`,
    );
  }

  async function createSchoolWithAdmin(
    key: 'a' | 'b',
    adminEmail: string,
    adminPassword: string,
  ): Promise<SchoolFlow> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/super-admin/schools')
      .set(bearer(superAdminToken))
      .send({
        name: `Phase 46 School ${key.toUpperCase()} ${runId}`,
        calendlyUrl: `https://calendly.com/phase-46-${key}-${runId}`,
      })
      .expect(201);

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
        lastName: 'Phase46',
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

    const tenantAdmin = await dataSource.query(
      `SELECT id FROM "${schema}".school_admin WHERE email = $1`,
      [adminEmail],
    );

    const studentInvite = await request(app.getHttpServer())
      .post('/api/v1/invitations/student')
      .set(bearer(login.body.access_token))
      .send({
        firstName: `Student${key.toUpperCase()}`,
        lastName: 'Phase46',
        email: `phase46-student-${key}-${runId}@example.com`,
      })
      .expect(201);

    return {
      key,
      school,
      schema,
      adminEmail,
      adminPassword,
      admin: login.body,
      adminId: tenantAdmin[0].id,
      studentId: studentInvite.body.id,
      parentId: '',
    };
  }

  async function linkParent(
    flow: SchoolFlow,
    email: string,
  ): Promise<{ parentId: string; invitationToken: string }> {
    const parentCreate = await request(app.getHttpServer())
      .post(`/api/v1/school-admin/students/${flow.studentId}/parents`)
      .set(bearer(flow.admin.access_token))
      .send({
        firstName: `Parent${flow.key.toUpperCase()}`,
        lastName: 'Shared',
        email,
        relationship: 'Parent',
      })
      .expect(201);

    const invitationToken = parentInvitationTokens.get(email.toLowerCase());
    expect(invitationToken).toBeDefined();

    const platformRow = await dataSource.query(
      `SELECT "schoolId", purpose FROM public.platform_prelogin_token
       WHERE token = $1`,
      [invitationToken],
    );
    expect(platformRow).toHaveLength(1);
    expect(platformRow[0].schoolId).toBe(flow.school.id);
    expect(platformRow[0].purpose).toBe('parent_invitation');

    return {
      parentId: parentCreate.body.id,
      invitationToken: invitationToken as string,
    };
  }

  async function registerManualResetToken(
    flow: SchoolFlow,
    parentId: string,
    purpose: 'parent' | 'school_admin',
  ): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const subjectId = purpose === 'parent' ? parentId : flow.adminId;
    const userType = purpose === 'parent' ? 'parent' : 'school_admin';
    const table = purpose === 'parent' ? 'parent' : 'school_admin';

    await dataSource.query(
      `UPDATE "${flow.schema}".${table}
       SET "resetPasswordToken" = $1, "resetPasswordExpires" = $2
       WHERE id = $3`,
      [token, expiresAt.toISOString(), subjectId],
    );
    await dataSource.query(
      `INSERT INTO public.platform_prelogin_token
       (id, token, "schoolId", "userType", purpose, "subjectId", "expiresAt", "consumedAt", "createdAt")
       VALUES ($1, $2, $3, $4, 'password_reset', $5, $6, NULL, NOW())`,
      [
        randomUUID(),
        token,
        flow.school.id,
        userType,
        subjectId,
        expiresAt.toISOString(),
      ],
    );
    return token;
  }

  beforeAll(async () => {
    process.env.JWT_SECRET ||= 'phase-46-prelogin-test-secret';
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

    const superAdminEmail = `phase46-super-${runId}@example.com`;
    const superAdminPassword = `Super-${runId}!`;
    await request(app.getHttpServer())
      .post('/api/v1/super-admin/auth/signup')
      .send({
        firstName: 'Phase46',
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
          `DELETE FROM public.platform_prelogin_token WHERE "schoolId" = ANY($1::uuid[])`,
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
           SELECT id::text FROM public.super_admin WHERE email LIKE 'phase46-super-%@example.com'
         )`,
      );
      await dataSource.query(
        `DELETE FROM public.super_admin WHERE email LIKE 'phase46-super-%@example.com'`,
      );
    }
    await app?.close();
  });

  it('fail-closes parent and school admin pre-login flows across two schools', async () => {
    const sharedEmail = `phase46-parent-shared-${runId}@example.com`;
    const passwordA = `Parent-A-${runId}!`;
    const passwordB = `Parent-B-${runId}!`;

    const flowA = await createSchoolWithAdmin(
      'a',
      `phase46-admin-a-${runId}@example.com`,
      `Admin-A-${runId}!`,
    );
    const flowB = await createSchoolWithAdmin(
      'b',
      `phase46-admin-b-${runId}@example.com`,
      `Admin-B-${runId}!`,
    );

    expect(jwtPayload(flowA.admin.access_token).schoolId).toBe(flowA.school.id);
    expect(jwtPayload(flowB.admin.access_token).schoolId).toBe(flowB.school.id);

    const parentA = await linkParent(flowA, sharedEmail);
    flowA.parentId = parentA.parentId;

    await request(app.getHttpServer())
      .post('/api/v1/invitations/complete-registration')
      .send({ token: parentA.invitationToken, password: passwordA })
      .expect(201);

    const loginAOnly = await request(app.getHttpServer())
      .post('/api/v1/parent/login')
      .send({ email: sharedEmail, password: passwordA })
      .expect(201);
    expect(jwtPayload(loginAOnly.body.access_token).schoolId).toBe(
      flowA.school.id,
    );

    const parentB = await linkParent(flowB, sharedEmail);
    flowB.parentId = parentB.parentId;

    await request(app.getHttpServer())
      .post('/api/v1/invitations/complete-registration')
      .send({ token: parentB.invitationToken, password: passwordB })
      .expect(201);

    const loginA = await request(app.getHttpServer())
      .post('/api/v1/parent/login')
      .send({ email: sharedEmail, password: passwordA })
      .expect(401);

    const loginB = await request(app.getHttpServer())
      .post('/api/v1/parent/login')
      .send({ email: sharedEmail, password: passwordB })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/parent/forgot-password')
      .send({ email: sharedEmail })
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/v1/invitations/complete-registration')
      .send({ token: parentA.invitationToken, password: 'AnotherPass123!' })
      .expect(400);

    const hashBeforeResetA = await dataSource.query(
      `SELECT password FROM "${flowA.schema}".parent WHERE id = $1`,
      [flowA.parentId],
    );
    const hashBeforeResetB = await dataSource.query(
      `SELECT password FROM "${flowB.schema}".parent WHERE id = $1`,
      [flowB.parentId],
    );

    const resetTokenA = await registerManualResetToken(
      flowA,
      flowA.parentId,
      'parent',
    );
    const resetTokenB = await registerManualResetToken(
      flowB,
      flowB.parentId,
      'parent',
    );
    const newPasswordA = `Reset-A-${runId}!`;
    const newPasswordB = `Reset-B-${runId}!`;

    await request(app.getHttpServer())
      .post('/api/v1/parent/reset-password')
      .send({ token: resetTokenA, password: newPasswordA })
      .expect(201);

    const hashAfterResetA = await dataSource.query(
      `SELECT password FROM "${flowA.schema}".parent WHERE id = $1`,
      [flowA.parentId],
    );
    const hashAfterResetB = await dataSource.query(
      `SELECT password FROM "${flowB.schema}".parent WHERE id = $1`,
      [flowB.parentId],
    );
    expect(hashAfterResetA[0].password).not.toBe(hashBeforeResetA[0].password);
    expect(hashAfterResetB[0].password).toBe(hashBeforeResetB[0].password);

    await request(app.getHttpServer())
      .post('/api/v1/parent/reset-password')
      .send({ token: resetTokenB, password: newPasswordB })
      .expect(201);

    const hashFinalB = await dataSource.query(
      `SELECT password FROM "${flowB.schema}".parent WHERE id = $1`,
      [flowB.parentId],
    );
    expect(hashFinalB[0].password).not.toBe(hashBeforeResetB[0].password);
    expect(hashFinalB[0].password).not.toBe(hashAfterResetA[0].password);

    const secondStudentA = await request(app.getHttpServer())
      .post('/api/v1/invitations/student')
      .set(bearer(flowA.admin.access_token))
      .send({
        firstName: 'Second',
        lastName: 'ChildA',
        email: `phase46-student-a2-${runId}@example.com`,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/school-admin/students/${secondStudentA.body.id}/parents`)
      .set(bearer(flowA.admin.access_token))
      .send({
        firstName: 'ParentA',
        lastName: 'Shared',
        email: sharedEmail,
        relationship: 'Parent',
      })
      .expect(201);

    const confirmToken = [...childConfirmTokens.values()].pop();
    expect(confirmToken).toBeDefined();

    await request(app.getHttpServer())
      .post('/api/v1/parent/relationships/confirm')
      .send({ token: confirmToken })
      .expect(201);

    const adminHashBeforeA = await dataSource.query(
      `SELECT password FROM "${flowA.schema}".school_admin WHERE id = $1`,
      [flowA.adminId],
    );
    const adminHashBeforeB = await dataSource.query(
      `SELECT password FROM "${flowB.schema}".school_admin WHERE id = $1`,
      [flowB.adminId],
    );

    await request(app.getHttpServer())
      .post('/api/v1/school-admin/forgot-password')
      .send({ email: flowA.adminEmail })
      .expect(201);
    const adminResetA = adminResetTokens.get(flowA.adminEmail.toLowerCase());
    expect(adminResetA).toBeDefined();

    await request(app.getHttpServer())
      .post('/api/v1/school-admin/forgot-password')
      .send({ email: flowB.adminEmail })
      .expect(201);
    const adminResetB = adminResetTokens.get(flowB.adminEmail.toLowerCase());
    expect(adminResetB).toBeDefined();

    const newAdminPasswordA = `AdminReset-A-${runId}!`;
    await request(app.getHttpServer())
      .post('/api/v1/school-admin/reset-password')
      .send({ token: adminResetA, password: newAdminPasswordA })
      .expect(201);

    const adminHashAfterA = await dataSource.query(
      `SELECT password FROM "${flowA.schema}".school_admin WHERE id = $1`,
      [flowA.adminId],
    );
    const adminHashAfterB = await dataSource.query(
      `SELECT password FROM "${flowB.schema}".school_admin WHERE id = $1`,
      [flowB.adminId],
    );
    expect(adminHashAfterA[0].password).not.toBe(adminHashBeforeA[0].password);
    expect(adminHashAfterB[0].password).toBe(adminHashBeforeB[0].password);

    await request(app.getHttpServer())
      .post('/api/v1/school-admin/login')
      .send({ email: flowA.adminEmail, password: newAdminPasswordA })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/school-admin/reset-password')
      .send({ token: randomUUID(), password: 'InvalidPass123!' })
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/v1/school-admin/login')
      .send({ email: flowB.adminEmail, password: flowB.adminPassword })
      .expect(201);

    const directoryRows = await dataSource.query(
      `SELECT "schoolId", "userType" FROM public.tenant_directory
       WHERE "loginKey" = $1 AND "userType" = 'parent'`,
      [sharedEmail],
    );
    expect(directoryRows).toHaveLength(2);
    expect(directoryRows.map((row: { schoolId: string }) => row.schoolId)).toEqual(
      expect.arrayContaining([flowA.school.id, flowB.school.id]),
    );
  });
});
