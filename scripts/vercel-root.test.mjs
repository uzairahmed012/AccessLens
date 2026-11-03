import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { repositoryRoot } from './vercel-root.mjs';

const scriptsDir = fileURLToPath(new URL('.', import.meta.url));
const root = dirname(scriptsDir);

test('repository root is found from nested locations', () => {
  assert.equal(repositoryRoot(scriptsDir), root);
  assert.equal(repositoryRoot(join(root, 'apps', 'api')), root);
  assert.equal(repositoryRoot(join(root, 'apps', 'web', 'src')), root);
});

test('vercel build rejects an unknown service', () => {
  const result = spawnSync(process.execPath, [join(scriptsDir, 'vercel-build.mjs'), 'worker'], {
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Usage: node scripts\/vercel-build\.mjs api\|web/);
});
