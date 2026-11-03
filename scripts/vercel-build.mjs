import process from 'node:process';
import { runNpm } from './vercel-npm.mjs';

const target = process.argv[2];
if (target !== 'api' && target !== 'web') {
  console.error('Usage: node scripts/vercel-build.mjs api|web');
  process.exit(1);
}

console.log(`AccessLens ${target} build: Node ${process.version}`);
if (target === 'api') runNpm(['run', 'db:generate']);
runNpm(['run', 'build', '--workspace', '@accesslens/shared']);
runNpm(['run', 'build', '--workspace', `@accesslens/${target}`]);
