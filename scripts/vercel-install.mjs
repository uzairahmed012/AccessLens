import process from 'node:process';
import { runNpm } from './vercel-npm.mjs';

console.log(`AccessLens install: Node ${process.version}`);
const args = ['ci', '--include=dev', '--workspaces', '--include-workspace-root'];
if (process.env.VERCEL === '1') args.push('--cache', '/tmp/accesslens-npm-cache');
runNpm(args);
