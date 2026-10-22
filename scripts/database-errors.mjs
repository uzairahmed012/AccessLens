// Never echo arbitrary CLI output or exception messages: they can contain URLs,
// passwords, database addresses or other environment values.
const toolErrors = new Map([
  [
    'MODULE_NOT_FOUND',
    'Prisma tooling or a required module is missing. Install API development dependencies.',
  ],
  [
    'ERR_PACKAGE_PATH_NOT_EXPORTED',
    'The installed Prisma package does not expose the requested CLI entrypoint.',
  ],
  ['ENOENT', 'A required executable or file could not be found.'],
  ['EACCES', 'The build process cannot access a required file or executable.'],
  ['EPERM', 'The build process cannot access a required file or executable.'],
  ['ETIMEDOUT', 'The Prisma command exceeded its time limit.'],
  ['ENOBUFS', 'The Prisma command exceeded its output buffer limit.'],
]);

export function databaseErrorMessage(error) {
  if (
    error instanceof Error &&
    !/postgres(?:ql)?:\/\/|password|@/i.test(error.message) &&
    [
      'Database writes are guarded',
      'DATABASE_URL must',
      'DIRECT_URL must',
      'The pooled and direct',
      'Prisma ',
    ].some((prefix) => error.message.startsWith(prefix))
  )
    return error.message;
  const detail = error && typeof error === 'object' ? toolErrors.get(error.code) : undefined;
  return detail
    ? `Database tooling error (${error.code}): ${detail} Connection details withheld.`
    : 'Database operation failed. Check credentials, TLS, network access and the production API build. Details withheld.';
}

export function prismaFailureMessage(operation, result) {
  // All fields included below are either fixed text, numeric status or a Prisma
  // error code. Raw stderr/stdout and environment values are never included.
  const status = Number.isInteger(result.status) ? `exit ${result.status}` : 'no exit status';
  const code = /\bP\d{4}\b/.exec(`${result.stderr || ''}\n${result.stdout || ''}`)?.[0];
  const detail = toolErrors.get(result.error?.code);
  return `Prisma ${operation} failed (${status}${code ? `, ${code}` : ''}). ${detail || 'Check configuration and network access.'} Raw diagnostics withheld.`;
}
