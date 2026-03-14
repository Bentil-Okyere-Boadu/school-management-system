#!/usr/bin/env node
/**
 * Launcher for the OpenAPI generator (runs the TypeScript script with ts-node).
 * Usage: node scripts/generate-openapi.mjs
 * Or via npm: npm run generate:openapi
 *
 * The actual logic lives in generate-openapi.ts so path aliases (src/*) work.
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

const result = spawnSync(
  'npx',
  [
    'ts-node',
    '-r',
    'tsconfig-paths/register',
    path.join(__dirname, 'generate-openapi.ts'),
  ],
  {
    stdio: 'inherit',
    cwd: backendRoot,
    shell: true,
  },
);

process.exit(result.status ?? 0);
