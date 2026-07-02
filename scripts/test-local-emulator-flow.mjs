import { readFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();

const readProjectId = async () => {
  try {
    const firebaserc = JSON.parse(await readFile(path.join(rootDir, '.firebaserc'), 'utf8'));
    return firebaserc?.projects?.default || 'event-cafe-2026';
  } catch {
    return 'event-cafe-2026';
  }
};

const projectId = await readProjectId();

const callable = async (name, data) => {
  const response = await fetch(
    `http://127.0.0.1:5001/${projectId}/asia-northeast1/${name}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ data }),
    },
  );

  const payload = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
};

const login = await callable('adminLogin', { password: '1112' });
const entry = await callable('submitLotteryEntry', { displayName: 'LocalTestUser' });
const duplicate = await callable('submitLotteryEntry', { displayName: 'localtestuser' });

console.log(
  JSON.stringify(
    {
      projectId,
      login,
      entry,
      duplicate,
    },
    null,
    2,
  ),
);
