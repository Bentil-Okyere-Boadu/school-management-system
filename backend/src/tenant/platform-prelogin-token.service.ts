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
    return {
      schoolId: row.schoolId,
      userType: row.userType,
      subjectId: row.subjectId,
      expiresAt: row.expiresAt,
    };
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
