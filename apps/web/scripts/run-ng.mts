import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webDir: string = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootEnvPath: string = path.resolve(webDir, '../../.env');

if (existsSync(rootEnvPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(rootEnvPath);
}

const require = createRequire(import.meta.url);
const ngBin: string = require.resolve('@angular/cli/bin/ng.js');
const ngArgs: string[] = [ngBin, ...process.argv.slice(2)];
const apiBaseUrl: string | undefined = process.env['API_BASE_URL']?.trim();

if (apiBaseUrl) {
  ngArgs.push('--define', `__API_BASE_URL__=${JSON.stringify(apiBaseUrl)}`);
}

const result = spawnSync(process.execPath, ngArgs, { cwd: webDir, stdio: 'inherit' });
process.exit(result.status ?? 1);
