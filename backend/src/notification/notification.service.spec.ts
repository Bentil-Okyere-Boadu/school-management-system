import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { Notification, NotificationType } from './notification.entity';
import { School } from 'src/school/school.entity';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';
import { SchoolProvisioningStatus } from 'src/tenant/school-provisioning-status';

describe('NotificationService', () => {
  let service: NotificationService;

  const notificationRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };

  const schoolRepository = {
    findOne: jest.fn(),
  };

  const tenantConnection = {
    tryGetStore: jest.fn(),
    runForSchoolId: jest.fn(
      async (_schoolId: string, fn: () => Promise<unknown>) => fn(),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    schoolRepository.findOne.mockResolvedValue({
      id: 'school-1',
      schemaName: 'tenant_school_1',
      provisioningStatus: SchoolProvisioningStatus.Active,
      isDisabled: false,
    });
    tenantConnection.tryGetStore.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: notificationRepository,
        },
        { provide: getRepositoryToken(School), useValue: schoolRepository },
        { provide: TenantConnectionService, useValue: tenantConnection },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('creates recipient notifications in tenant context', async () => {
    await service.createForRecipients({
      schoolId: 'school-1',
      type: NotificationType.Attendance,
      title: 'Marked absent',
      message: 'You were marked absent on 2026-01-15',
      recipients: [{ id: 'student-1', role: 'student' as never }],
    });

    expect(tenantConnection.runForSchoolId).toHaveBeenCalledWith(
      'school-1',
      expect.any(Function),
    );
    expect(notificationRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientId: 'student-1',
        school: { id: 'school-1' },
      }),
    ]);
  });

  it('creates school broadcast and student notifications for absent attendance', async () => {
    const createSpy = jest
      .spyOn(service, 'create')
      .mockResolvedValue({ id: 'notification-1' } as Notification);
    const recipientsSpy = jest
      .spyOn(service, 'createForRecipients')
      .mockResolvedValue(undefined);

    await service.notifyStudentAbsent({
      schoolId: 'school-1',
      studentId: 'student-1',
      studentName: 'Jane Doe',
      className: 'Grade 6',
      date: '2026-01-15',
    });

    expect(recipientsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        recipients: [{ id: 'student-1', role: 'student' }],
      }),
    );
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: 'school-1',
        title: 'Student marked absent',
        message:
          'Jane Doe was marked absent in Grade 6 on 2026-01-15',
      }),
    );
  });
});
