import { Global, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { School } from 'src/school/school.entity';
import { Role } from 'src/role/role.entity';
import { TenantDirectory } from './entities/tenant-directory.entity';
import { PlatformInvitation } from './entities/platform-invitation.entity';
import { PlatformPreloginToken } from './entities/platform-prelogin-token.entity';
import { PlatformPreloginTokenService } from './platform-prelogin-token.service';
import { TenantResolverService } from './tenant-resolver.service';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantOrmService } from './tenant-orm.service';
import { TenantProvisionerService } from './tenant-provisioner.service';
import { TenantSchemaMigrator } from './tenant-schema-migrator.service';
import { TenantSchemaInspector } from './tenant-schema-inspector.service';
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
      PlatformPreloginToken,
      Role,
    ]),
  ],
  providers: [
    TenantResolverService,
    TenantConnectionService,
    TenantOrmService,
    TenantProvisionerService,
    TenantSchemaMigrator,
    TenantSchemaInspector,
    TenantOnboardingService,
    TenantIterationService,
    TenantDirectoryService,
    TenantUserLookupService,
    PlatformPreloginTokenService,
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
    TenantSchemaMigrator,
    TenantSchemaInspector,
    TenantOnboardingService,
    TenantIterationService,
    TenantDirectoryService,
    TenantUserLookupService,
    PlatformPreloginTokenService,
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
