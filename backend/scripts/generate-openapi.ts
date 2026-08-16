/**
 * Generates OpenAPI (Swagger) JSON files per module for the NestJS application.
 * Run with: npm run generate:openapi  (or node scripts/generate-openapi.mjs)
 *
 * - Set OPENAPI_SERVER_URL (default: http://localhost:3000) for servers[0].url (Postman-compatible).
 * - Output is written to docs/, one JSON file per @ApiTags group.
 * - Bootstrap connects to the app's TypeORM DB; ensure DB is reachable or env is set.
 */

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFile, mkdir } from 'fs/promises';
import * as pathModule from 'path';
import { AppModule } from '../src/app.module';

console.log('Starting OpenAPI generator');

// Resolve script directory for output path (works with ts-node and node)
const scriptDir =
  typeof __dirname !== 'undefined'
    ? __dirname
    : pathModule.dirname(process.argv[1] || '.');

/** Configurable server URL for OpenAPI servers[0].url (Postman-compatible). */
const SERVER_URL =
  process.env.OPENAPI_SERVER_URL || 'http://localhost:3000';

/** Global API prefix; must match main.ts. */
const GLOBAL_PREFIX = 'api/v1';

/** Base title for the API; per-tag files get "{OPENAPI_TITLE} - {Tag}" so Postman shows distinct collection names. */
const OPENAPI_TITLE = 'School Management';

/**
 * Tag → output filename (without .json).
 * Add or change entries to control which modules get their own OpenAPI file.
 */
const TAG_TO_FILE: Record<string, string> = {
  'Super Admin': 'super-admin',
  'School Admin': 'school-admin',
  Teacher: 'teacher',
  Student: 'student',
  Auth: 'auth',
  School: 'school',
  Profile: 'profile',
  Admission: 'admission',
  Subject: 'subject',
  Planner: 'planner',
  Notification: 'notification',
  'Academic Calendar': 'academic-calendar',
  'Class Level': 'class-level',
  'Fee Structure': 'fee-structure',
  'Grading System': 'grading-system',
  Curriculum: 'curriculum',
  Parent: 'parent',
  Invitation: 'invitation',
  Attendance: 'attendance',
  'Admission Policy': 'admission-policy',
  Role: 'role',
  Permission: 'permission',
  Common: 'common',
};

type OpenAPIObject = {
  openapi?: string;
  info?: object;
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, object>;
  components?: { schemas?: Record<string, object> };
  tags?: Array<{ name: string; description?: string }>;
};

/**
 * Collect all $ref values from an object (paths and nested operations).
 */
function collectRefs(obj: unknown, refs: Set<string>): void {
  if (obj === null || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach((v) => collectRefs(v, refs));
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k === '$ref' && typeof v === 'string') refs.add(v);
    else collectRefs(v, refs);
  }
}

/**
 * Extract schema key from a $ref (e.g. "#/components/schemas/User" -> "User").
 */
function schemaKeyFromRef(ref: string): string | null {
  const match = ref.match(/#\/components\/schemas\/(.+)/);
  return match ? match[1] : null;
}

/**
 * Filter the full OpenAPI document to only paths that have the given tag,
 * and include only components/schemas that are referenced by those paths.
 */
function filterDocByTag(
  fullDoc: OpenAPIObject,
  tag: string,
): OpenAPIObject {
  const filteredPaths: Record<string, object> = {};
  const refs = new Set<string>();

  for (const [pathKey, pathItem] of Object.entries(fullDoc.paths || {})) {
    const pathObj = pathItem as Record<string, { tags?: string[] }>;
    let hasTag = false;
    for (const op of Object.values(pathObj)) {
      if (op && typeof op === 'object' && op.tags && op.tags.includes(tag)) {
        hasTag = true;
        break;
      }
    }
    if (hasTag) {
      filteredPaths[pathKey] = pathItem;
      collectRefs(pathItem, refs);
    }
  }

  const schemas: Record<string, object> = {};
  const allSchemas = fullDoc.components?.schemas || {};
  const addReferencedSchemas = (refSet: Set<string>) => {
    for (const ref of refSet) {
      const key = schemaKeyFromRef(ref);
      if (key && allSchemas[key] && !schemas[key]) {
        schemas[key] = allSchemas[key];
        const nested = new Set<string>();
        collectRefs(allSchemas[key], nested);
        addReferencedSchemas(nested);
      }
    }
  };
  addReferencedSchemas(refs);

  const baseInfo = (fullDoc.info || { version: '1.0' }) as Record<string, unknown>;
  return {
    openapi: fullDoc.openapi || '3.0.0',
    info: { ...baseInfo, title: `${OPENAPI_TITLE} - ${tag}` },
    servers: [{ url: SERVER_URL, description: 'API Server' }],
    paths: filteredPaths,
    components: Object.keys(schemas).length ? { schemas } : undefined,
    tags: fullDoc.tags?.filter((t) => t.name === tag) || [],
  };
}

/**
 * Fallback: group paths by prefix when they have no tags (e.g. /api/v1/school-admin -> school-admin).
 */
function pathPrefixToTag(pathKey: string): string | null {
  const prefix = `/${GLOBAL_PREFIX}/`;
  if (!pathKey.startsWith(prefix)) return null;
  const after = pathKey.slice(prefix.length);
  const segment = after.split('/')[0];
  if (!segment) return null;
  const tag = segment
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
  return tag;
}

/**
 * Build a doc for paths that have no @ApiTags, grouped by path prefix.
 */
function filterDocByPathPrefix(
  fullDoc: OpenAPIObject,
  pathPrefix: string,
): OpenAPIObject {
  const prefix = `/${GLOBAL_PREFIX}/${pathPrefix}`;
  const filteredPaths: Record<string, object> = {};
  const refs = new Set<string>();

  for (const [pathKey, pathItem] of Object.entries(fullDoc.paths || {})) {
    if (pathKey === prefix || pathKey.startsWith(prefix + '/')) {
      filteredPaths[pathKey] = pathItem;
      collectRefs(pathItem, refs);
    }
  }

  const schemas: Record<string, object> = {};
  const allSchemas = fullDoc.components?.schemas || {};
  const addReferencedSchemas = (refSet: Set<string>) => {
    for (const ref of refSet) {
      const key = schemaKeyFromRef(ref);
      if (key && allSchemas[key] && !schemas[key]) {
        schemas[key] = allSchemas[key];
        const nested = new Set<string>();
        collectRefs(allSchemas[key], nested);
        addReferencedSchemas(nested);
      }
    }
  };
  addReferencedSchemas(refs);

  const pathPrefixTitle = pathPrefix
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
  const baseInfo = (fullDoc.info || { version: '1.0' }) as Record<string, unknown>;
  return {
    openapi: fullDoc.openapi || '3.0.0',
    info: { ...baseInfo, title: `${OPENAPI_TITLE} - ${pathPrefixTitle}` },
    servers: [{ url: SERVER_URL, description: 'API Server' }],
    paths: filteredPaths,
    components: Object.keys(schemas).length ? { schemas } : undefined,
    tags: [{ name: pathPrefix }],
  };
}

async function main(): Promise<void> {
  console.log('Bootstrapping Nest app to generate OpenAPI...');
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  app.setGlobalPrefix(GLOBAL_PREFIX);

  const config = new DocumentBuilder()
    .setTitle('School Management API')
    .setDescription('OpenAPI spec for Postman and other clients')
    .setVersion('1.0')
    .addServer(SERVER_URL, 'API Server')
    .addBearerAuth()
    .build();

  const fullDoc = SwaggerModule.createDocument(app, config) as OpenAPIObject;
  fullDoc.servers = [{ url: SERVER_URL, description: 'API Server' }];

  await app.close();

  const docsDir = pathModule.resolve(scriptDir, '..', 'docs');
  await mkdir(docsDir, { recursive: true });

  await writeFile(
    pathModule.join(docsDir, 'openapi.json'),
    JSON.stringify(fullDoc, null, 2),
    'utf-8',
  );
  console.log('Wrote openapi.json (combined spec)');

  const writtenTags = new Set<string>();
  const writtenPrefixes = new Set<string>();

  for (const [tag, fileSlug] of Object.entries(TAG_TO_FILE)) {
    const filtered = filterDocByTag(fullDoc, tag);
    if (Object.keys(filtered.paths).length > 0) {
      const filePath = pathModule.join(docsDir, `${fileSlug}.json`);
      await writeFile(
        filePath,
        JSON.stringify(filtered, null, 2),
        'utf-8',
      );
      writtenTags.add(tag);
      console.log(`Wrote ${fileSlug}.json (tag: ${tag})`);
    }
  }

  // Fallback: paths with no tag, group by first path segment
  const pathPrefixes = new Set<string>();
  for (const pathKey of Object.keys(fullDoc.paths || {})) {
    const tag = pathPrefixToTag(pathKey);
    if (tag && !writtenTags.has(tag)) pathPrefixes.add(tag.toLowerCase().replace(/ /g, '-'));
  }
  for (const pathPrefix of pathPrefixes) {
    if (writtenPrefixes.has(pathPrefix)) continue;
    const filtered = filterDocByPathPrefix(fullDoc, pathPrefix);
    if (Object.keys(filtered.paths).length > 0) {
      const filePath = pathModule.join(docsDir, `${pathPrefix}.json`);
      await writeFile(
        filePath,
        JSON.stringify(filtered, null, 2),
        'utf-8',
      );
      writtenPrefixes.add(pathPrefix);
      console.log(`Wrote ${pathPrefix}.json (by path prefix)`);
    }
  }

  console.log(`\nOpenAPI files written to ${docsDir}`);
  console.log(`Server URL in spec: ${SERVER_URL}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
