import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExternalApiProxyController } from './external-api-proxy.controller';
import { ExternalApiProxyService } from './external-api-proxy.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ExternalApiProxyController],
  providers: [ExternalApiProxyService],
})
export class ExternalApiProxyModule {}
