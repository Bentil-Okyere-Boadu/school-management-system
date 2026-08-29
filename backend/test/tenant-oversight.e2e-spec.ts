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
import { Student } from '../src/student/student.entity';
import { SchoolProvisioningStatus } from '../src/tenant/school-provisioning-status';
import { tenantSchemaName } from '../src/tenant/tenant-schema.util';
import { TenantConnectionService } from '../src/tenant/tenant-connection.service';
import { TenantDirectoryService } from '../src/tenant/tenant-directory.service';
import {
  PaymentTransaction,
  PaymentTransactionStatus,
} from '../src/payments/entities/payment-transaction.entity';
import {
  Notification,
  NotificationType,
} from '../src/notification/notification.entity';

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
  className: string;
};

describe('Tenancy oversight (A1–A4)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let schoolRepository: Repository<School>;
  let tenantConnection: TenantConnectionService;
  let tenantDirectory: TenantDirectoryService;
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
    sendAdmissionApplicationConfirmation: jest.fn().mockResolvedValue(undefined),
    sendAdmissionAcceptedEmail: jest.fn().mockResolvedValue(undefined),
    sendStudentInvitation: jest.fn().mockResolvedValue(undefined),
    sendStudentPinReset: jest.fn().mockResolvedValue(undefined),
    sendTeacherPinReset: jest.fn().mockResolvedValue(undefined),
  };

  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

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
        `SELECT id, "schemaName" FROM public.school WHERE name LIKE 'Phase Oversight %'`,
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
         SELECT id::text FROM public.super_admin WHERE email LIKE 'phase-oversight-super-%@example.com'
       )`,
    );
    await dataSource.query(
      `DELETE FROM public.super_admin WHERE email LIKE 'phase-oversight-super-%@example.com'`,
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
        name: `Phase Oversight School ${key.toUpperCase()} ${runId}`,
        calendlyUrl: `https://calendly.com/phase-oversight-${key}-${runId}`,
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
        lastName: 'Oversight',
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

    const className = `Oversight Class ${key.toUpperCase()}`;
    await request(app.getHttpServer())
      .post('/api/v1/class-level')
      .set(bearer(login.body.access_token))
      .send({
        name: className,
        description: `Tenant ${key.toUpperCase()}`,
      })
      .expect(201);

    return { key, school, schema, admin: login.body, className };
  }

  function ussdIdentify(identifier: string, sessionId: string) {
    return {
      Type: 'Response',
      Message: identifier,
      ServiceCode: '*000#',
      Operator: 'MTN',
      ClientState: 'await_student:all',
      Mobile: '233200000000',
      SessionId: sessionId,
      Sequence: 2,
      Platform: 'USSD',
    };
  }

  function hubtelPaidCallback(clientReference: string) {
    return {
      ResponseCode: '0000',
      Message: 'Success',
      Data: {
        Amount: 25,
        Charges: 0,
        AmountAfterCharges: 25,
        ClientReference: clientReference,
        TransactionId: `hubtel-${clientReference}`,
      },
    };
  }

  beforeAll(async () => {
    process.env.JWT_SECRET ||= 'phase-oversight-test-secret';
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
    tenantConnection = app.get(TenantConnectionService);
    tenantDirectory = app.get(TenantDirectoryService);
    await removeStaleArtifacts();
    const roles = await ensureRoles();
    schoolAdminRoleId = roles.school_admin.id;

    const superAdminEmail = `phase-oversight-super-${runId}@example.com`;
    const superAdminPassword = `Super-${runId}!`;
    await request(app.getHttpServer())
      .post('/api/v1/super-admin/auth/signup')
      .send({
        firstName: 'PhaseOversight',
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
        `DELETE FROM public.refresh_token
         WHERE "userType" = 'super_admin'
         AND "userId" IN (
           SELECT id::text FROM public.super_admin WHERE email LIKE 'phase-oversight-super-%@example.com'
         )`,
      );
      await dataSource.query(
        `DELETE FROM public.super_admin WHERE email LIKE 'phase-oversight-super-%@example.com'`,
      );
    }
    if (app) {
      await app.close();
    }
  });

  it('isolates Hubtel callback, USSD lookup, public class-levels, and notification mutations', async () => {
    const schoolA = await createSchool(
      'a',
      `phase-oversight-admin-a-${runId}@example.com`,
      `AdminA-${runId}!`,
    );
    const schoolB = await createSchool(
      'b',
      `phase-oversight-admin-b-${runId}@example.com`,
      `AdminB-${runId}!`,
    );

    const inviteStudent = async (flow: SchoolFlow) => {
      const email = `phase-oversight-student-${flow.key}-${runId}@example.com`;
      const invite = await request(app.getHttpServer())
        .post('/api/v1/invitations/student')
        .set(bearer(flow.admin.access_token))
        .send({
          firstName: `Student${flow.key.toUpperCase()}`,
          lastName: 'Oversight',
          email,
        })
        .expect(201);
      const row = await dataSource.query(
        `SELECT id, "studentId", "studentBillingCode" FROM "${flow.schema}".student WHERE id = $1`,
        [invite.body.id],
      );
      return {
        id: row[0].id as string,
        studentId: row[0].studentId as string,
        billingCode: row[0].studentBillingCode as string,
      };
    };

    const studentA = await inviteStudent(schoolA);
    const studentB = await inviteStudent(schoolB);
    expect(studentA.billingCode).toMatch(/^SBC\d{6}$/);
    expect(studentB.billingCode).toMatch(/^SBC\d{6}$/);

    const levelsA = await request(app.getHttpServer())
      .get(`/api/v1/admissions/class-levels/${schoolA.school.id}`)
      .expect(200);
    const levelsB = await request(app.getHttpServer())
      .get(`/api/v1/admissions/class-levels/${schoolB.school.id}`)
      .expect(200);
    expect(levelsA.body.map((row: { name: string }) => row.name)).toEqual([
      schoolA.className,
    ]);
    expect(levelsB.body.map((row: { name: string }) => row.name)).toEqual([
      schoolB.className,
    ]);
    expect(levelsA.body[0].id).not.toBe(levelsB.body[0].id);

    const unknownLevels = await request(app.getHttpServer())
      .get('/api/v1/admissions/class-levels/00000000-0000-4000-8000-000000000000')
      .expect(200);
    expect(unknownLevels.body).toEqual([]);

    const ussdA = await request(app.getHttpServer())
      .post('/api/v1/integrations/hubtel/interaction')
      .send(ussdIdentify(studentA.studentId, `sess-a-${runId}`))
      .expect(201);
    expect(String(ussdA.body.Message)).not.toMatch(/Not found/i);

    const ussdBillingA = await request(app.getHttpServer())
      .post('/api/v1/integrations/hubtel/interaction')
      .send(ussdIdentify(studentA.billingCode, `sess-a-code-${runId}`))
      .expect(201);
    expect(String(ussdBillingA.body.Message)).not.toMatch(/Not found/i);

    const ussdBAsA = await request(app.getHttpServer())
      .post('/api/v1/integrations/hubtel/interaction')
      .send(ussdIdentify(studentB.studentId, `sess-b-as-a-${runId}`))
      .expect(201);
    expect(String(ussdBAsA.body.Message)).not.toMatch(/StudentA/i);

    const sharedCode = 'SBC999001';
    await dataSource.query(
      `UPDATE "${schoolA.schema}".student SET "studentBillingCode" = $1 WHERE id = $2`,
      [sharedCode, studentA.id],
    );
    await dataSource.query(
      `UPDATE "${schoolB.schema}".student SET "studentBillingCode" = $1 WHERE id = $2`,
      [sharedCode, studentB.id],
    );
    await tenantDirectory.upsert({
      loginKey: sharedCode,
      userType: 'student',
      schoolId: schoolA.school.id,
      tenantUserId: studentA.id,
    });
    await tenantDirectory.upsert({
      loginKey: sharedCode,
      userType: 'student',
      schoolId: schoolB.school.id,
      tenantUserId: studentB.id,
    });

    const ussdCollision = await request(app.getHttpServer())
      .post('/api/v1/integrations/hubtel/interaction')
      .send(ussdIdentify(sharedCode, `sess-collision-${runId}`))
      .expect(201);
    expect(String(ussdCollision.body.Message)).toMatch(/Not found/i);

    const clientReference = `ref${runId.replace(/-/g, '').slice(0, 24)}`;
    await tenantConnection.runForSchoolId(schoolA.school.id, async (manager) => {
      const student = await manager.findOne(Student, {
        where: { id: studentA.id },
        relations: ['school'],
      });
      if (!student) {
        throw new Error('Student A missing in tenant');
      }
      const txn = manager.create(PaymentTransaction, {
        sessionId: clientReference,
        student,
        school: student.school,
        amount: 25,
        mobile: '233200000000',
        status: PaymentTransactionStatus.PENDING,
      });
      await manager.save(txn);
    });

    const mismatch = await request(app.getHttpServer())
      .post(
        `/api/v1/integrations/hubtel/receive-money/callback/${schoolB.school.id}`,
      )
      .send(hubtelPaidCallback(clientReference))
      .expect(400);
    expect(String(mismatch.body.message)).toMatch(
      /Unknown ClientReference|School mismatch/i,
    );

    const paymentTable = dataSource.getMetadata(PaymentTransaction).tableName;
    const stillPending = await dataSource.query(
      `SELECT status FROM "${schoolA.schema}"."${paymentTable}" WHERE "sessionId" = $1`,
      [clientReference],
    );
    expect(stillPending[0].status).toBe(PaymentTransactionStatus.PENDING);

    const paid = await request(app.getHttpServer())
      .post(
        `/api/v1/integrations/hubtel/receive-money/callback/${schoolA.school.id}`,
      )
      .send(hubtelPaidCallback(clientReference))
      .expect(200);
    expect(paid.body.ok).toBe(true);
    expect(paid.body.duplicate).toBe(false);
    expect(paid.body.status).toBe(PaymentTransactionStatus.PAID);

    const afterPaid = await dataSource.query(
      `SELECT status FROM "${schoolA.schema}"."${paymentTable}" WHERE "sessionId" = $1`,
      [clientReference],
    );
    expect(afterPaid[0].status).toBe(PaymentTransactionStatus.PAID);
    const noneInB = await dataSource.query(
      `SELECT COUNT(*)::int AS count FROM "${schoolB.schema}"."${paymentTable}" WHERE "sessionId" = $1`,
      [clientReference],
    );
    expect(noneInB[0].count).toBe(0);

    const replay = await request(app.getHttpServer())
      .post(
        `/api/v1/integrations/hubtel/receive-money/callback/${schoolA.school.id}`,
      )
      .send(hubtelPaidCallback(clientReference))
      .expect(200);
    expect(replay.body.duplicate).toBe(true);
    expect(replay.body.status).toBe(PaymentTransactionStatus.PAID);

    const unauthCreate = await request(app.getHttpServer())
      .post('/api/v1/notifications')
      .send({
        title: 'Nope',
        message: 'Unauthenticated',
        type: NotificationType.General,
        schoolId: schoolA.school.id,
      })
      .expect(401);
    expect(unauthCreate.status).toBe(401);

    const createdA = await request(app.getHttpServer())
      .post('/api/v1/notifications')
      .set(bearer(schoolA.admin.access_token))
      .send({
        title: 'A notice',
        message: 'School A only',
        type: NotificationType.General,
        schoolId: schoolA.school.id,
      })
      .expect(201);
    const createdB = await request(app.getHttpServer())
      .post('/api/v1/notifications')
      .set(bearer(schoolB.admin.access_token))
      .send({
        title: 'B notice',
        message: 'School B only',
        type: NotificationType.General,
        schoolId: schoolB.school.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${createdB.body.id}/markAsRead`)
      .set(bearer(schoolA.admin.access_token))
      .expect(404);

    const notificationTable = dataSource.getMetadata(Notification).tableName;
    const bUnread = await dataSource.query(
      `SELECT read FROM "${schoolB.schema}"."${notificationTable}" WHERE id = $1`,
      [createdB.body.id],
    );
    expect(bUnread[0].read).toBe(false);

    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${createdA.body.id}/markAsRead`)
      .set(bearer(schoolA.admin.access_token))
      .expect(200);

    const aRead = await dataSource.query(
      `SELECT read FROM "${schoolA.schema}"."${notificationTable}" WHERE id = $1`,
      [createdA.body.id],
    );
    expect(aRead[0].read).toBe(true);

    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${createdA.body.id}`)
      .expect(401);
    await request(app.getHttpServer())
      .delete(`/api/v1/notifications/${createdA.body.id}`)
      .expect(401);
  });
});
