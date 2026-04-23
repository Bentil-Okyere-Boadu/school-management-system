import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HubtelFulfilmentCallbackDto } from './dto/hubtel-fulfilment-callback.dto';

const MAX_BODY_LOG_CHARS = 2000;

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
        const bodyJson = JSON.stringify(payload);
        this.logger.debug(
          `Hubtel fulfilment callback attempt ${attempt}/${this.maxRetries}: POST ${this.callbackUrl} body=${bodyJson}`,
        );

        const response = await fetch(this.callbackUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: bodyJson,
        });

        const responseText = await response.text();

        if (!response.ok) {
          this.logger.warn(
            `Hubtel fulfilment callback HTTP ${response.status} SessionId=${payload.SessionId} responseBody=${responseText.slice(0, MAX_BODY_LOG_CHARS)}`,
          );
          throw new Error(
            `Hubtel callback failed with status ${response.status}`,
          );
        }

        this.logger.log(
          `Hubtel fulfilment callback: success SessionId=${payload.SessionId} OrderId=${payload.OrderId} ServiceStatus=${payload.ServiceStatus} httpStatus=${response.status}`,
        );
        this.logger.debug(
          `Hubtel fulfilment callback response body: ${responseText.slice(0, MAX_BODY_LOG_CHARS)}`,
        );
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
