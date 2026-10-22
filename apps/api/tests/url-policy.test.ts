import { describe, expect, it, vi } from 'vitest';
import { createUrlPolicy, isPublicAddress, normalizeTarget } from '../src/scans/url-policy.js';

describe('URL intake boundary', () => {
  it.each([
    'file:///etc/passwd',
    'ftp://example.com',
    'javascript:alert(1)',
    '//example.com',
    'https://user:pass@example.com',
    'https://@example.com',
    'https://example.com@evil.com',
    'http://127.0.0.1',
    'http://2130706433',
    'http://0x7f000001',
    'http://0177.0.0.1',
    'https://[::1]',
    'https://[::ffff:127.0.0.1]',
    'https://8.8.8.8',
    'https://localhost',
    'https://site.local',
    'http://metadata.google.internal',
    'http://169.254.169.254',
    'https://example.com:8080',
    'http://example.com:443',
    'https://%65xample.com',
    'https://example.com..',
    'https://example.com\\@evil.com',
    'https://exam\nple.com',
    'https://bad_host.com',
    'https://example.com/\u0000',
  ])('rejects ambiguous or forbidden target %s', (url) => {
    expect(() => normalizeTarget(url)).toThrow();
  });
  it('normalizes scheme, hostname, default port, path and fragment', () => {
    expect(normalizeTarget('HTTPS://Example.COM.:443/a/../b?q=1#section').href).toBe(
      'https://example.com/b?q=1',
    );
    expect(normalizeTarget('https://example.com?email=user@example.com').href).toBe(
      'https://example.com/?email=user@example.com',
    );
  });
  it.each([
    '0.0.0.0',
    '10.1.2.3',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '192.168.1.1',
    '100.64.0.1',
    '192.0.0.8',
    '192.0.2.1',
    '198.18.0.1',
    '198.51.100.1',
    '203.0.113.1',
    '224.0.0.1',
    '240.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    'fc00::1',
    'fe80::1',
    'ff02::1',
    '::ffff:10.0.0.1',
    '2001:db8::1',
    '2001::1',
    '2002:7f00:1::',
    '64:ff9b::7f00:1',
    '3fff::1',
    'not-an-ip',
  ])('rejects nonpublic DNS address %s', (ip) => expect(isPublicAddress(ip)).toBe(false));
  it.each(['93.184.216.34', '8.8.8.8', '2606:4700:4700::1111'])(
    'accepts public DNS address %s',
    (ip) => expect(isPublicAddress(ip)).toBe(true),
  );
  it('does not resolve an unapproved host, suffix lookalike, or subdomain', async () => {
    const resolve = vi.fn(async () => ['93.184.216.34']);
    const policy = createUrlPolicy(['example.com'], resolve);
    for (const url of [
      'https://evil.com',
      'https://example.com.evil.com',
      'https://www.example.com',
    ])
      await expect(policy(url)).rejects.toMatchObject({ code: 'URL_NOT_ALLOWED' });
    expect(resolve).not.toHaveBeenCalled();
  });
  it('requires explicit punycode approval for an international hostname', async () => {
    const resolve = vi.fn(async () => ['93.184.216.34']);
    await expect(createUrlPolicy(['example.com'], resolve)('https://bücher.de')).rejects.toThrow();
    expect(await createUrlPolicy(['xn--bcher-kva.de'], resolve)('https://bücher.de')).toBe(
      'https://xn--bcher-kva.de/',
    );
  });
  it('rejects every mixed DNS answer, empty answer and lookup failure', async () => {
    for (const answers of [
      [],
      ['93.184.216.34', '10.0.0.1'],
      ['2606:4700::1', '::1'],
      Array(65).fill('8.8.8.8') as string[],
    ])
      await expect(
        createUrlPolicy(['example.com'], async () => answers)('https://example.com'),
      ).rejects.toThrow();
    await expect(
      createUrlPolicy(['example.com'], async () => {
        throw new Error('private DNS details');
      })('https://example.com'),
    ).rejects.toMatchObject({
      code: 'DNS_LOOKUP_FAILED',
      message: expect.not.stringContaining('private DNS'),
    });
  });
  it('fails closed with empty or invalid allowlist configuration', async () => {
    for (const hosts of [[], ['*.example.com'], ['https://example.com'], ['example.com:443']])
      await expect(createUrlPolicy(hosts)('https://example.com')).rejects.toMatchObject({
        code: 'INTAKE_NOT_CONFIGURED',
      });
  });
  it('bounds pending lookups and times out safely', async () => {
    vi.useFakeTimers();
    try {
      const policy = createUrlPolicy(['example.com'], () => new Promise(() => {}));
      const pending = Array.from({ length: 8 }, () =>
        policy('https://example.com').catch((error: unknown) => error),
      );
      await expect(policy('https://example.com')).rejects.toMatchObject({
        code: 'DNS_LOOKUP_FAILED',
      });
      await vi.advanceTimersByTimeAsync(3001);
      expect((await Promise.all(pending)).every((error) => error instanceof Error)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
