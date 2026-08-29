import { Global, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { School } from 'src/school/school.entity';
import { Role } from 'src/role/role.entity';
import { TenantDirectory } from './entities/tenant-directory.entity';
import { PlatformInvitation } from './entities/platform-invitation.entity';
import { TenantResolverService } from './tenant-resolver.service';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantOrmService } from './tenant-orm.service';
import { TenantProvisionerService } from './tenant-provisioner.service';
import { TenantOnboardingService } from './tenant-onboarding.service';
import { TenantRequestInterceptor } from './tenant-request.interceptor';
import { TenantIterationService } from './tenant-iteration.service';
import { TenantDirectoryService } from './tenant-directory.service';
import { TenantUserLookupService } from './tenant-user-lookup.service';
import { bindTenantRepositories } from './tenant-repository-binder';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      School,
      TenantDirectory,
      PlatformInvitation,
      Role,
    ]),
  ],
  providers: [
    TenantResolverService,
    TenantConnectionService,
    TenantOrmService,
    TenantProvisionerService,
    TenantOnboardingService,
    TenantIterationService,
    TenantDirectoryService,
    TenantUserLookupService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantRequestInterceptor,
    },
  ],
  exports: [
    TenantResolverService,
    TenantConnectionService,
    TenantOrmService,
    TenantProvisionerService,
    TenantOnboardingService,
    TenantIterationService,
    TenantDirectoryService,
    TenantUserLookupService,
    TypeOrmModule,
  ],
})
export class TenantModule implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantConnection: TenantConnectionService,
  ) {}

  onModuleInit(): void {
    bindTenantRepositories(this.dataSource, this.tenantConnection);
  }
}
