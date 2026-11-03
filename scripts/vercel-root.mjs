import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function repositoryRoot(from = fileURLToPath(new URL('.', import.meta.url))) {
  let dir = from;
  while (true) {
    const manifest = join(dir, 'package.json');
    if (existsSync(manifest)) {
      try {
        const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
        if (pkg.name === 'accesslens' && Array.isArray(pkg.workspaces)) return dir;
      } catch {
        // Nested or unreadable package.json files are not the repository root.
      }
    }
    const parent = dirname(dir);
    if (parent === dir) throw new Error('AccessLens repository root was not found.');
    dir = parent;
  }
}
