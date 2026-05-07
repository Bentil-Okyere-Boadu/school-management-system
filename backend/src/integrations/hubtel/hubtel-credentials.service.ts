import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from 'src/school/school.entity';
import { EncryptionService } from 'src/common/utils/encryption.util';

export interface ResolvedHubtelMerchant {
  schoolId: string;
  clientId: string;
  clientSecret: string;
  collectionAccountNumber: string;
  basicAuthHeader: string;
}

/**
 * Loads and decrypts a school's Hubtel merchant credentials so they can be
 * used to call the Direct Receive Money / Status APIs scoped to that school's
 * Hubtel merchant account. Funds settle directly to the school — the platform
 * never holds funds.
 */
@Injectable()
export class HubtelCredentialsService {
  private readonly logger = new Logger(HubtelCredentialsService.name);

  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async getMerchantCredentials(
    schoolId: string,
  ): Promise<ResolvedHubtelMerchant> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }
    return this.fromSchool(school);
  }

  /**
   * Build credentials directly from a loaded School entity, when callers
   * already have it (avoids a redundant DB round-trip).
   */
  fromSchool(school: School): ResolvedHubtelMerchant {
    if (!school.hubtelMerchantActive) {
      throw new BadRequestException(
        `School ${school.id} Hubtel merchant is not active`,
      );
    }
    if (
      !school.hubtelClientId ||
      !school.hubtelClientSecretEnc ||
      !school.hubtelCollectionAccountNumber
    ) {
      throw new BadRequestException(
        `School ${school.id} Hubtel merchant is not fully configured`,
      );
    }

    let clientSecret: string;
    try {
      clientSecret = this.encryptionService.decrypt(
        school.hubtelClientSecretEnc,
      );
    } catch (err) {
      this.logger.error(
        `Failed to decrypt Hubtel client secret for school ${school.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw new BadRequestException(
        `Failed to load Hubtel credentials for school ${school.id}`,
      );
    }

    const basicAuthHeader = this.buildBasicAuthHeader(
      school.hubtelClientId,
      clientSecret,
    );

    return {
      schoolId: school.id,
      clientId: school.hubtelClientId,
      clientSecret,
      collectionAccountNumber: school.hubtelCollectionAccountNumber,
      basicAuthHeader,
    };
  }

  private buildBasicAuthHeader(clientId: string, clientSecret: string): string {
    const credentials = Buffer.from(
      `${clientId}:${clientSecret}`,
      'utf8',
    ).toString('base64');
    return `Basic ${credentials}`;
  }
}
