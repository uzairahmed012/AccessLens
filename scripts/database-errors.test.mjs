import assert from 'node:assert/strict';
import { test } from 'node:test';
import { databaseErrorMessage, prismaFailureMessage } from './database-errors.mjs';

const secret = 'postgresql://private-user:private-password@private-db.neon.tech/db';

test('unknown errors with credentials are withheld', () => {
  const message = databaseErrorMessage(new Error(secret));
  assert.doesNotMatch(message, /private-user|private-password|private-db/);
  assert.match(message, /Details withheld/);
});

test('missing tooling reports a safe module code without file paths', () => {
  const error = Object.assign(new Error(`Cannot find module at ${secret}`), {
    code: 'MODULE_NOT_FOUND',
  });
  const message = databaseErrorMessage(error);
  assert.match(message, /MODULE_NOT_FOUND/);
  assert.match(message, /API development dependencies/);
  assert.doesNotMatch(message, /private-user|private-password|private-db/);
});

test('unknown exception codes cannot inject secret values', () => {
  const error = Object.assign(new Error(secret), { code: secret });
  assert.doesNotMatch(databaseErrorMessage(error), /private-user|private-password|private-db/);
});

test('migration guards retain actionable safe instructions', () => {
  const error = new Error('Database writes are guarded. Confirm an isolated development branch.');
  assert.equal(databaseErrorMessage(error), error.message);
});

test('Prisma failures show exit and error code while withholding raw output', () => {
  const message = prismaFailureMessage('generate', {
    status: 1,
    stderr: `Error P1012: ${secret}`,
    stdout: `Connecting to private-db.neon.tech with ${secret}`,
  });
  assert.match(message, /exit 1, P1012/);
  assert.doesNotMatch(message, /private-user|private-password|private-db/);
  assert.equal(databaseErrorMessage(new Error(message)), message);
});

test('spawn failures show a safe timeout explanation', () => {
  const message = prismaFailureMessage('generate', {
    status: null,
    error: { code: 'ETIMEDOUT', message: secret },
    stderr: secret,
  });
  assert.match(message, /no exit status/);
  assert.match(message, /time limit/);
  assert.doesNotMatch(message, /private-user|private-password|private-db/);
});
