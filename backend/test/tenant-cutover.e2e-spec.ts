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
import { collectTenantTableNames } from '../src/tenant/tenant-metadata';
import {
  LEGACY_PUBLIC_TENANT_TABLES,
  PLATFORM_PUBLIC_TABLES,
} from '../src/tenant/legacy-public-tenant-tables';

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
  classLevelId: string;
  className: string;
};

const EXPECTED_TENANT_TABLES = [
  'school_admin',
  'profile',
  'class_level',
  'student',
  'teacher',
  'event_category',
  'grading_system',
] as const;

describe('Phase 4 cutover (two schools)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let schoolRepository: Repository<School>;
  let superAdminToken: string;
  let schoolAdminRoleId: string;
  const createdSchoolIds: string[] = [];
  const createdSchemaNames: string[] = [];
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const emailRetryMock = {
    retrySendInvitationEmail: jest.fn().mockResolvedValue(undefined),
    retrySendTeacherInvitation: jest.fn().mockResolvedValue(undefined),
    retrySendStudentInvitation: jest.fn().mockResolvedValue(undefined),
  };

  const emailServiceMock = {
    sendParentInvitationEmail: jest.fn().mockResolvedValue(undefined),
    sendParentChildConfirmationEmail: jest.fn().mockResolvedValue(undefined),
    sendRegistrationConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  };

  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  function records(body: unknown): Array<{ id?: string; name?: string }> {
    if (Array.isArray(body)) {
      return body as Array<{ id?: string; name?: string }>;
    }
    const value = body as {
      data?: Array<{ id?: string }> | { data?: Array<{ id?: string }> };
    };
    if (Array.isArray(value?.data)) {
      return value.data;
    }
    return value?.data?.data ?? [];
  }

  async function publicTables(): Promise<string[]> {
    const rows: Array<{ tablename: string }> = await dataSource.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1`,
    );
    return rows.map((row) => row.tablename);
  }

  async function schemaTables(schema: string): Promise<string[]> {
    const rows: Array<{ tablename: string }> = await dataSource.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY 1`,
      [schema],
    );
    return rows.map((row) => row.tablename);
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

  async function removeStalePhase4Artifacts(): Promise<void> {
    const staleSchools: Array<{ id: string; schemaName: string | null }> =
      await dataSource.query(
        `SELECT id, "schemaName" FROM public.school WHERE name LIKE 'Phase 4 %'`,
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
         SELECT id::text FROM public.super_admin WHERE email LIKE 'phase4-super-%@example.com'
       )`,
    );
    await dataSource.query(
      `DELETE FROM public.super_admin WHERE email LIKE 'phase4-super-%@example.com'`,
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
        name: `Phase 4 School ${key.toUpperCase()} ${runId}`,
        calendlyUrl: `https://calendly.com/phase-4-${key}-${runId}`,
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
        lastName: 'PhaseFour',
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

    const className = `Phase 4 Class ${key.toUpperCase()}`;
    const classLevel = await request(app.getHttpServer())
      .post('/api/v1/class-level')
      .set(bearer(login.body.access_token))
      .send({
        name: className,
        description: `Tenant ${key.toUpperCase()} original`,
      })
      .expect(201);

    return {
      key,
      school,
      schema,
      admin: login.body,
      classLevelId: classLevel.body.id,
      className,
    };
  }

  beforeAll(async () => {
    process.env.JWT_SECRET ||= 'phase-4-cutover-test-secret';
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
    await removeStalePhase4Artifacts();
    const roles = await ensureRoles();
    schoolAdminRoleId = roles.school_admin.id;

    const superAdminEmail = `phase4-super-${runId}@example.com`;
    const superAdminPassword = `Super-${runId}!`;
    await request(app.getHttpServer())
      .post('/api/v1/super-admin/auth/signup')
      .send({
        firstName: 'PhaseFour',
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
           SELECT id::text FROM public.super_admin WHERE email LIKE $1
         )`,
        [`phase4-super-%-${runId}@example.com`],
      );
      await dataSource.query(
        `DELETE FROM public.super_admin WHERE email = $1`,
        [`phase4-super-${runId}@example.com`],
      );
    }
    if (app) {
      await app.close();
    }
  });

  it('keeps A and B in their own schemas and rejects adversarial cross-school CRUD', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/schools/create')
      .set(bearer(superAdminToken))
      .send({
        name: 'Should Fail',
        calendlyUrl: 'https://calendly.com/phase-4-dead',
      })
      .expect(404);

    const flowA = await createSchool(
      'a',
      `phase4-admin-a-${runId}@example.com`,
      `Admin-A-${runId}!`,
    );
    const flowB = await createSchool(
      'b',
      `phase4-admin-b-${runId}@example.com`,
      `Admin-B-${runId}!`,
    );

    const tenantTableNames = collectTenantTableNames(dataSource);
    const publicNames = await publicTables();
    const operationalInPublic = publicNames.filter(
      (name) =>
        tenantTableNames.includes(name) ||
        LEGACY_PUBLIC_TENANT_TABLES.includes(name),
    );
    expect(operationalInPublic).toEqual([]);

    const allowlist = new Set(PLATFORM_PUBLIC_TABLES);
    expect(publicNames.every((name) => allowlist.has(name))).toBe(true);
    expect(publicNames).toEqual(
      expect.arrayContaining([
        'school',
        'role',
        'refresh_token',
        'super_admin',
        'tenant_directory',
        'platform_invitation',
        'migrations',
      ]),
    );

    for (const flow of [flowA, flowB]) {
      const tables = await schemaTables(flow.schema);
      for (const table of EXPECTED_TENANT_TABLES) {
        expect(tables).toContain(table);
      }
      expect(tables).not.toContain('school');
      expect(tables).not.toContain('role');

      const classRows = await dataSource.query(
        `SELECT id, name FROM "${flow.schema}".class_level WHERE id = $1`,
        [flow.classLevelId],
      );
      expect(classRows).toEqual([
        { id: flow.classLevelId, name: flow.className },
      ]);
    }

    const publicClassLevel = await dataSource.query(
      `SELECT to_regclass('public.class_level') AS table_name`,
    );
    expect(publicClassLevel[0].table_name).toBeNull();

    const publicSchoolAdmin = await dataSource.query(
      `SELECT to_regclass('public.school_admin') AS table_name`,
    );
    expect(publicSchoolAdmin[0].table_name).toBeNull();

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
          name: other.className,
          description: `Tenant ${other.key.toUpperCase()} original`,
        },
      ]);

      const classes = await request(app.getHttpServer())
        .get('/api/v1/class-level')
        .set(currentAdmin)
        .expect(200);
      const ids = records(classes.body).map((item) => item.id);
      expect(ids).toContain(current.classLevelId);
      expect(ids).not.toContain(other.classLevelId);
    }

    const dashboard = await request(app.getHttpServer())
      .get('/api/v1/schools/dashboard')
      .set(bearer(superAdminToken))
      .expect(200);
    expect(dashboard.body.totalSchools).toBeGreaterThanOrEqual(2);

    const catalog = await request(app.getHttpServer())
      .get('/api/v1/super-admin/admins/schools?limit=100')
      .set(bearer(superAdminToken))
      .expect(200);
    const catalogIds = records(catalog.body).map((item) => item.id);
    expect(catalogIds).toEqual(
      expect.arrayContaining([flowA.school.id, flowB.school.id]),
    );
  });
});
