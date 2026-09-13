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
};

describe('Tenant admin eligibility and provisioning guards', () => {
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

  async function ensureRoles(): Promise<Record<string, Role>> {
    const repository = dataSource.getRepository(Role);
    const roles: Record<string, Role> = {};
    for (const name of ['super_admin', 'school_admin']) {
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

  async function createSchoolAdmin(): Promise<{
    school: School;
    adminId: string;
    adminEmail: string;
    auth: AuthResponse;
  }> {
    const adminEmail = `eligibility-admin-${runId}@example.com`;
    const adminPassword = `Admin-${runId}!`;

    const schoolRes = await request(app.getHttpServer())
      .post('/api/v1/super-admin/schools')
      .set(bearer(superAdminToken))
      .send({
        name: `Eligibility School ${runId}`,
        calendlyUrl: `https://calendly.com/eligibility-${runId}`,
      })
      .expect(201);

    const school = await schoolRepository.findOneByOrFail({
      id: schoolRes.body.id,
    });
    createdSchoolIds.push(school.id);
    createdSchemaNames.push(tenantSchemaName(school.id));

    const invite = await request(app.getHttpServer())
      .post('/api/v1/invitations/admin')
      .set(bearer(superAdminToken))
      .send({
        firstName: 'Eligible',
        lastName: 'Admin',
        email: adminEmail,
        roleId: schoolAdminRoleId,
        schoolId: school.id,
      })
      .expect(201);

    const platformInvitation = await dataSource.query(
      `SELECT token FROM public.platform_invitation WHERE id = $1`,
      [invite.body.id],
    );

    const auth = await request(app.getHttpServer())
      .post('/api/v1/invitations/complete-registration')
      .send({
        token: platformInvitation[0].token,
        password: adminPassword,
      })
      .expect(201);

    const tenantAdmin = await dataSource.query(
      `SELECT id FROM "${tenantSchemaName(school.id)}".school_admin WHERE email = $1`,
      [adminEmail],
    );

    return {
      school,
      adminId: tenantAdmin[0].id,
      adminEmail,
      auth: {
        access_token: auth.body.access_token,
        refresh_token: auth.body.refresh_token,
      },
    };
  }

  beforeAll(async () => {
    process.env.JWT_SECRET ||= 'eligibility-test-secret';
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
    const roles = await ensureRoles();
    schoolAdminRoleId = roles.school_admin.id;

    const superAdminEmail = `eligibility-super-${runId}@example.com`;
    const superAdminPassword = `Super-${runId}!`;
    await request(app.getHttpServer())
      .post('/api/v1/super-admin/auth/signup')
      .send({
        firstName: 'Eligibility',
        lastName: 'Super',
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
           SELECT id::text FROM public.super_admin WHERE email LIKE 'eligibility-super-%@example.com'
         )`,
      );
      await dataSource.query(
        `DELETE FROM public.super_admin WHERE email LIKE 'eligibility-super-%@example.com'`,
      );
    }
    await app?.close();
  });

  it('rejects suspended school admin JWT and refresh', async () => {
    const { school, adminId, auth } = await createSchoolAdmin();

    await request(app.getHttpServer())
      .put(`/api/v1/super-admin/admin/${adminId}/suspend`)
      .set(bearer(superAdminToken))
      .send({ suspend: true })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/school-admin/me')
      .set(bearer(auth.access_token))
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: auth.refresh_token })
      .expect(401);

    const schools = await request(app.getHttpServer())
      .get('/api/v1/super-admin/schools')
      .set(bearer(superAdminToken))
      .expect(200);

    const listed = (schools.body.data as Array<{
      id: string;
      adminSummary?: { activeAdmins: number };
    }>).find((row) => row.id === school.id);
    expect(listed?.adminSummary?.activeAdmins).toBe(0);
  });

  it('no-ops retryProvision for active schools', async () => {
    const { school } = await createSchoolAdmin();

    const response = await request(app.getHttpServer())
      .post(`/api/v1/super-admin/schools/${school.id}/provision`)
      .set(bearer(superAdminToken))
      .expect(201);

    expect(response.body.provisioningStatus).toBe(
      SchoolProvisioningStatus.Active,
    );

    const reloaded = await schoolRepository.findOneByOrFail({ id: school.id });
    expect(reloaded.provisioningStatus).toBe(SchoolProvisioningStatus.Active);
  });
});
