import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Each Vercel service has an explicit build command. In particular, the web
// installation must not require the API's Prisma tooling or database settings.
if (process.env.VERCEL === '1') {
  console.log('Vercel: deferring shared compilation and Prisma generation to service builds.');
} else if (!process.env.npm_execpath) {
  console.error('Run this setup using npm run prepare.');
  process.exitCode = 1;
} else {
  const root = fileURLToPath(new URL('../', import.meta.url));
  for (const args of [
    ['run', 'build', '--workspace', '@accesslens/shared'],
    ['run', 'db:generate'],
  ]) {
    const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
      cwd: root,
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      if (result.error)
        console.error('Local setup command could not start. Check the Node/npm installation.');
      process.exitCode = result.status || 1;
      break;
    }
  }
}
