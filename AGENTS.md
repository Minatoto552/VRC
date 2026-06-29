# AGENTS.md

## Project rules
- This repository is a React + TypeScript + Vite application for 「2026年3月同期会 Event Café」.
- Use strict TypeScript. Do not introduce `any` unless there is no safe alternative.
- Do not put secrets, passwords, Firebase service account JSON, or real `.env` values in Git.
- The admin shared password must be stored with Firebase Secret Manager as `ADMIN_SHARED_PASSWORD`.
- Keep public pages mobile-first and accessible; do not rely on color alone for state.

## Commands
- Install: `npm install` and `cd functions && npm install`
- Dev server: `npm run dev`
- Type check: `npm run typecheck` and `cd functions && npm run build`
- Lint: `npm run lint`
- Test: `npm test`
- Build: `npm run build`
- Emulators: `firebase emulators:start`

## Firebase
- Firestore rules are in `firestore.rules` and deny by default.
- Cloud Functions source is in `functions/src/index.ts`.
- Public lottery entry writes must go through Cloud Functions, not direct Firestore writes.
