import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 12;
  private readonly TAG_LENGTH = 16;
  private readonly key: Buffer | null;

  constructor(private readonly configService: ConfigService) {
    this.key = this.loadKey();
  }

  private loadKey(): Buffer | null {
    const raw = this.configService.get<string>('APP_ENCRYPTION_KEY', '').trim();
    if (!raw) {
      this.logger.warn(
        'APP_ENCRYPTION_KEY not set; encryption operations will fail until configured',
      );
      return null;
    }
    let buf: Buffer;
    try {
      buf = Buffer.from(raw, 'base64');
    } catch {
      this.logger.error('APP_ENCRYPTION_KEY is not valid base64');
      return null;
    }
    if (buf.length === 32) {
      return buf;
    }
    // Fallback: derive 32-byte key by sha256 if user provided a passphrase
    this.logger.warn(
      `APP_ENCRYPTION_KEY base64-decoded to ${buf.length} bytes; deriving 32-byte key via SHA-256`,
    );
    return createHash('sha256').update(raw, 'utf8').digest();
  }

  isConfigured(): boolean {
    return this.key !== null;
  }

  encrypt(plaintext: string): string {
    if (!this.key) {
      throw new InternalServerErrorException(
        'Encryption key (APP_ENCRYPTION_KEY) is not configured',
      );
    }
    const iv = randomBytes(this.IV_LENGTH);
    const cipher = createCipheriv(this.ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]).toString('base64');
  }

  decrypt(encoded: string): string {
    if (!this.key) {
      throw new InternalServerErrorException(
        'Encryption key (APP_ENCRYPTION_KEY) is not configured',
      );
    }
    const buf = Buffer.from(encoded, 'base64');
    if (buf.length < this.IV_LENGTH + this.TAG_LENGTH + 1) {
      throw new InternalServerErrorException('Encrypted payload is malformed');
    }
    const iv = buf.subarray(0, this.IV_LENGTH);
    const tag = buf.subarray(this.IV_LENGTH, this.IV_LENGTH + this.TAG_LENGTH);
    const ciphertext = buf.subarray(this.IV_LENGTH + this.TAG_LENGTH);
    const decipher = createDecipheriv(this.ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}
