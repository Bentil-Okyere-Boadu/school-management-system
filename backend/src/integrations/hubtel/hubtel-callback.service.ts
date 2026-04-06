import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HubtelFulfilmentCallbackDto } from './dto/hubtel-fulfilment-callback.dto';

@Injectable()
export class HubtelCallbackService {
  private readonly logger = new Logger(HubtelCallbackService.name);
  private readonly callbackUrl: string;
  private readonly maxRetries: number;

  constructor(private readonly configService: ConfigService) {
    this.callbackUrl =
      this.configService.get<string>('HUBTEL_SERVICE_CALLBACK_URL')?.trim() ??
      '';
    this.maxRetries = this.configService.get<number>(
      'HUBTEL_CALLBACK_MAX_RETRIES',
      3,
    );
  }

  async sendFulfilmentCallback(
    payload: HubtelFulfilmentCallbackDto,
  ): Promise<void> {
    if (!this.callbackUrl) {
      this.logger.warn(
        'HUBTEL_SERVICE_CALLBACK_URL not configured; skipping Hubtel fulfilment callback',
      );
      return;
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await fetch(this.callbackUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(
            `Hubtel callback failed with status ${response.status}`,
          );
        }

        return;
      } catch (error) {
        lastError = error;
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        this.logger.warn(
          `Hubtel callback attempt ${attempt}/${this.maxRetries} failed for ${payload.SessionId}: ${String(error)}`,
        );

        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw lastError;
  }
}
