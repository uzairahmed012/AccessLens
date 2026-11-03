import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { repositoryRoot } from './vercel-root.mjs';

export function runNpm(args, env = process.env) {
  const cwd = repositoryRoot();
  const npmCli = env.npm_execpath;
  const result = npmCli
    ? spawnSync(process.execPath, [npmCli, ...args], { cwd, stdio: 'inherit', env })
    : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
        cwd,
        stdio: 'inherit',
        env,
        shell: process.platform === 'win32',
      });
  if (result.error) {
    console.error('npm could not start. Check the Node/npm installation.');
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
