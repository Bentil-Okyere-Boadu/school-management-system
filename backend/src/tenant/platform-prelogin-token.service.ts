import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PlatformPreloginToken,
  PreloginTokenPurpose,
  PreloginUserType,
} from './entities/platform-prelogin-token.entity';

export type ResolvedPreloginToken = {
  schoolId: string;
  userType: PreloginUserType;
  subjectId: string;
  expiresAt: Date;
};

function toResolvedPreloginToken(
  row: PlatformPreloginToken,
): ResolvedPreloginToken {
  return {
    schoolId: row.schoolId,
    userType: row.userType,
    subjectId: row.subjectId,
    expiresAt: row.expiresAt,
  };
}

type ClaimedTokenRow = {
  schoolId: string;
  userType: PreloginUserType;
  subjectId: string;
  expiresAt: Date | string;
};

function mapClaimedTokenRow(row: ClaimedTokenRow): ResolvedPreloginToken {
  return {
    schoolId: row.schoolId,
    userType: row.userType,
    subjectId: row.subjectId,
    expiresAt:
      row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt),
  };
}

@Injectable()
export class PlatformPreloginTokenService {
  constructor(
    @InjectRepository(PlatformPreloginToken)
    private readonly tokenRepository: Repository<PlatformPreloginToken>,
  ) {}

  async register(params: {
    token: string;
    schoolId: string;
    userType: PreloginUserType;
    purpose: PreloginTokenPurpose;
    subjectId: string;
    expiresAt: Date;
  }): Promise<void> {
    const existing = await this.tokenRepository.find({
      where: {
        schoolId: params.schoolId,
        userType: params.userType,
        purpose: params.purpose,
        subjectId: params.subjectId,
      },
    });
    if (existing.length > 0) {
      await this.tokenRepository.remove(existing);
    }

    await this.tokenRepository.save(
      this.tokenRepository.create({
        token: params.token,
        schoolId: params.schoolId,
        userType: params.userType,
        purpose: params.purpose,
        subjectId: params.subjectId,
        expiresAt: params.expiresAt,
        consumedAt: null,
      }),
    );
  }

  async releaseClaim(
    token: string,
    purpose: PreloginTokenPurpose,
  ): Promise<void> {
    await this.tokenRepository.query(
      `UPDATE platform_prelogin_token
       SET "consumedAt" = NULL
       WHERE token = $1
         AND purpose = $2
         AND "consumedAt" IS NOT NULL`,
      [token, purpose],
    );
  }

  async claimForUse(
    token: string,
    purpose: PreloginTokenPurpose,
  ): Promise<ResolvedPreloginToken> {
    const rows: ClaimedTokenRow[] = await this.tokenRepository.query(
      `UPDATE platform_prelogin_token
       SET "consumedAt" = NOW()
       WHERE token = $1
         AND purpose = $2
         AND "consumedAt" IS NULL
         AND "expiresAt" > NOW()
       RETURNING "schoolId", "userType", "subjectId", "expiresAt"`,
      [token, purpose],
    );

    const claimed = rows[0];
    if (claimed?.schoolId && claimed.userType && claimed.subjectId) {
      return mapClaimedTokenRow(claimed);
    }

    const existing = await this.tokenRepository.findOne({
      where: { token, purpose },
    });
    if (existing?.consumedAt) {
      throw new BadRequestException('Token has already been used');
    }
    if (existing && existing.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException(
        'Expired token - please request a new link',
      );
    }
    throw new NotFoundException('Invalid or expired token');
  }

  async resolve(
    token: string,
    purpose: PreloginTokenPurpose,
  ): Promise<ResolvedPreloginToken> {
    const row = await this.tokenRepository.findOne({
      where: { token, purpose },
    });
    if (!row) {
      throw new NotFoundException('Invalid or expired token');
    }
    if (row.consumedAt) {
      throw new BadRequestException('Token has already been used');
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException(
        'Expired token - please request a new link',
      );
    }
    return toResolvedPreloginToken(row);
  }

  async consume(token: string, purpose: PreloginTokenPurpose): Promise<void> {
    const row = await this.tokenRepository.findOne({
      where: { token, purpose },
    });
    if (!row) {
      return;
    }
    row.consumedAt = new Date();
    await this.tokenRepository.save(row);
  }

  async deleteExpired(before: Date): Promise<number> {
    const expired = await this.tokenRepository
      .createQueryBuilder()
      .delete()
      .from(PlatformPreloginToken)
      .where('"expiresAt" < :before', { before })
      .execute();
    const consumed = await this.tokenRepository
      .createQueryBuilder()
      .delete()
      .from(PlatformPreloginToken)
      .where('"consumedAt" IS NOT NULL AND "consumedAt" < :before', {
        before,
      })
      .execute();
    return (expired.affected ?? 0) + (consumed.affected ?? 0);
  }
}
