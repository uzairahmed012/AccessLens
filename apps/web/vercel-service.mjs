const command = process.argv[2];
if (command === 'install') {
  await import('../../scripts/vercel-install.mjs');
} else if (command === 'build') {
  process.argv[2] = 'web';
  await import('../../scripts/vercel-build.mjs');
} else {
  console.error('Usage: node vercel-service.mjs install|build');
  process.exit(1);
}
