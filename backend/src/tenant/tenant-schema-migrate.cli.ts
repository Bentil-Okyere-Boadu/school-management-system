import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { TenantSchemaMigrator } from './tenant-schema-migrator.service';

config();

async function main(): Promise<void> {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'school_management',
    entities: [__dirname + '/../**/*.entity.{ts,js}'],
    migrations: [__dirname + '/../migrations/*.{ts,js}'],
    synchronize: false,
    migrationsRun: true,
  });

  await ds.initialize();
  const migrator = new TenantSchemaMigrator(ds);

  try {
    const summary = await migrator.migrateAll();
    console.log(
      `Tenant migration complete: head=${summary.head} ok=${summary.ok} failed=${summary.failed} skipped=${summary.skipped}`,
    );
    if (summary.failures.length) {
      for (const failure of summary.failures) {
        console.error(`  FAILED ${failure.schoolId}: ${failure.error}`);
      }
    }
    process.exit(summary.failed > 0 ? 1 : 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Tenant migration aborted: ${message}`);
    const exitCode = message.includes('advisory lock') ? 2 : 1;
    process.exit(exitCode);
  } finally {
    await ds.destroy();
  }
}

main();
