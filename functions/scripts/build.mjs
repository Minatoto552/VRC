import { createRequire } from 'node:module';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(import.meta.dirname, '..');
const tscBin = require.resolve('typescript/bin/tsc');

const tscResult = spawnSync(process.execPath, [tscBin, '-p', 'tsconfig.json'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

if (tscResult.status !== 0) {
  process.exit(tscResult.status ?? 1);
}
