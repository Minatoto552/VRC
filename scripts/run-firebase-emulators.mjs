import { existsSync, lstatSync, mkdirSync, realpathSync, symlinkSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();
const driveRoot = path.parse(rootDir).root;
const asciiRuntimeDir = path.join(driveRoot, 'codex_vrc_cafe');
const needsAsciiRuntime = process.platform === 'win32' && /[^\u0000-\u007f]/.test(rootDir);

const ensureAsciiRuntime = () => {
  if (!needsAsciiRuntime) {
    return rootDir;
  }

  if (!existsSync(asciiRuntimeDir)) {
    mkdirSync(path.dirname(asciiRuntimeDir), { recursive: true });
    symlinkSync(rootDir, asciiRuntimeDir, 'junction');
  } else {
    const stat = lstatSync(asciiRuntimeDir);
    if (!stat.isSymbolicLink()) {
      throw new Error(
        `${asciiRuntimeDir} already exists and is not the automatic junction used for the emulator.`,
      );
    }

    const existingTarget = realpathSync(asciiRuntimeDir);
    const expectedTarget = realpathSync(rootDir);
    if (existingTarget.toLowerCase() !== expectedTarget.toLowerCase()) {
      throw new Error(
        `${asciiRuntimeDir} points to ${existingTarget}. Remove it or repoint it to ${expectedTarget}.`,
      );
    }
  }

  return asciiRuntimeDir;
};

const runtimeDir = ensureAsciiRuntime();

const readProjectId = async () => {
  try {
    const firebaserc = JSON.parse(await readFile(path.join(rootDir, '.firebaserc'), 'utf8'));
    return firebaserc?.projects?.default || 'event-cafe-2026';
  } catch {
    return 'event-cafe-2026';
  }
};

if (runtimeDir !== rootDir) {
  console.log(`Using ASCII runtime path for Firebase Emulator: ${runtimeDir}`);
}

const projectId = await readProjectId();

const child = spawn(
  process.execPath,
  ['./scripts/with-local-java.mjs', 'firebase', 'emulators:start', '--project', projectId],
  {
    cwd: runtimeDir,
    stdio: 'inherit',
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
