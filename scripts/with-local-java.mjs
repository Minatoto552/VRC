import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = process.cwd();
const toolsDir = path.join(rootDir, '.tools');

const findLocalJavaHome = () => {
  if (!existsSync(toolsDir)) {
    return null;
  }

  const candidates = readdirSync(toolsDir)
    .filter((entry) => entry.startsWith('jdk-'))
    .map((entry) => path.join(toolsDir, entry))
    .filter((entry) =>
      existsSync(path.join(entry, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')),
    )
    .sort()
    .reverse();

  return candidates[0] ?? null;
};

const findInstalledJavaHome = () => {
  const baseDirs = [
    path.join('C:', 'Program Files', 'Eclipse Adoptium'),
    path.join('C:', 'Program Files', 'Java'),
  ];

  for (const baseDir of baseDirs) {
    if (!existsSync(baseDir)) {
      continue;
    }

    const candidates = readdirSync(baseDir)
      .map((entry) => path.join(baseDir, entry))
      .filter((entry) =>
        existsSync(path.join(entry, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')),
      )
      .sort()
      .reverse();

    if (candidates[0]) {
      return candidates[0];
    }
  }

  return null;
};

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('No command specified for with-local-java.mjs');
  process.exit(1);
}

const command = args[0];
const commandArgs = args.slice(1);
const env = { ...process.env };
const localJavaHome = findLocalJavaHome() ?? findInstalledJavaHome();
const nodeBinDir = path.dirname(process.execPath);

env.PATH = `${nodeBinDir}${path.delimiter}${env.PATH ?? ''}`;

if (localJavaHome) {
  env.JAVA_HOME = localJavaHome;
  env.PATH = `${path.join(localJavaHome, 'bin')}${path.delimiter}${env.PATH ?? ''}`;
}

const executable =
  command === 'firebase'
    ? process.execPath
    : command;

const resolvedCommandArgs = commandArgs.map((arg) => {
  if (arg !== '__RULES_TEST__') {
    return arg;
  }

  const vitestEntry = path.join(rootDir, 'node_modules', 'vitest', 'vitest.mjs');
  return `"${process.execPath}" "${vitestEntry}" run --config vitest.rules.config.ts`;
});

const executableArgs =
  command === 'firebase'
    ? [require.resolve('firebase-tools/lib/bin/firebase.js'), ...resolvedCommandArgs]
    : resolvedCommandArgs;

const child = spawn(executable, executableArgs, {
  cwd: rootDir,
  env,
  shell: false,
  stdio: 'inherit',
});

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
