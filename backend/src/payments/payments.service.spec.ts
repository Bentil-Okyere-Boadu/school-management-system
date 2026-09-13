import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentTransaction, PaymentTransactionStatus } from './entities/payment-transaction.entity';
import { PaymentProviderEvent } from './entities/payment-provider-event.entity';
import { PaymentReceipt } from './entities/payment-receipt.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { Student } from 'src/student/student.entity';
import { FeeStructure } from 'src/fee-structure/fee-structure.entity';
import { School } from 'src/school/school.entity';
import { CheckoutOtp } from './entities/checkout-otp.entity';
import { TransactionUtil } from 'src/common/utils/transaction.util';
import { EmailService } from 'src/common/services/email.service';
import { FeeObligationService } from './fee-obligation.service';
import { StudentCreditService } from './student-credit.service';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';
import { TenantDirectoryService } from 'src/tenant/tenant-directory.service';
import { TenantUserLookupService } from 'src/tenant/tenant-user-lookup.service';

describe('PaymentsService tenant scope', () => {
  let service: PaymentsService;

  const paymentTransactionRepository = {
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
  };

  const tenantConnection = {
    tryGetStore: jest.fn(),
    runForSchoolId: jest.fn(
      async (_schoolId: string, fn: () => Promise<unknown>) => fn(),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    tenantConnection.tryGetStore.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(PaymentTransaction),
          useValue: paymentTransactionRepository,
        },
        {
          provide: getRepositoryToken(PaymentProviderEvent),
          useValue: {},
        },
        { provide: getRepositoryToken(PaymentReceipt), useValue: {} },
        { provide: getRepositoryToken(PaymentAllocation), useValue: {} },
        { provide: getRepositoryToken(Student), useValue: {} },
        { provide: getRepositoryToken(FeeStructure), useValue: {} },
        { provide: getRepositoryToken(School), useValue: {} },
        { provide: getRepositoryToken(CheckoutOtp), useValue: {} },
        { provide: TransactionUtil, useValue: {} },
        { provide: EmailService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: FeeObligationService, useValue: {} },
        { provide: StudentCreditService, useValue: {} },
        { provide: TenantConnectionService, useValue: tenantConnection },
        { provide: TenantDirectoryService, useValue: {} },
        { provide: TenantUserLookupService, useValue: {} },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('updateTransactionStatusFromHubtel uses runForSchoolId when tenant store is missing', async () => {
    const transaction = {
      id: 'txn-1',
      sessionId: 'session-abc',
      status: PaymentTransactionStatus.PENDING,
    };
    paymentTransactionRepository.findOne.mockResolvedValue(transaction);

    await service.updateTransactionStatusFromHubtel({
      sessionId: 'session-abc',
      schoolId: 'school-1',
      status: PaymentTransactionStatus.PAID,
    });

    expect(tenantConnection.runForSchoolId).toHaveBeenCalledWith(
      'school-1',
      expect.any(Function),
    );
    expect(paymentTransactionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: PaymentTransactionStatus.PAID }),
    );
  });

  it('markTransactionFailed uses runForSchoolId when tenant store is missing', async () => {
    paymentTransactionRepository.findOne.mockResolvedValue({
      id: 'txn-1',
      status: PaymentTransactionStatus.PENDING,
    });

    await service.markTransactionFailed(
      'txn-1',
      'declined',
      { code: '0001' },
      'school-1',
    );

    expect(tenantConnection.runForSchoolId).toHaveBeenCalledWith(
      'school-1',
      expect.any(Function),
    );
    expect(paymentTransactionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: PaymentTransactionStatus.FAILED }),
    );
  });
});
