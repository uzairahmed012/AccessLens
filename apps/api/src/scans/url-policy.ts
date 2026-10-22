import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import ipaddr from 'ipaddr.js';
import { AppError } from '../middleware/errors.js';

export type DnsResolver = (hostname: string) => Promise<readonly string[]>;
export const resolveAddresses: DnsResolver = async (hostname) =>
  (await lookup(hostname, { all: true, verbatim: true })).map(({ address }) => address);
const denied = () =>
  new AppError(
    403,
    'URL_NOT_ALLOWED',
    'Use an approved public website with a standard HTTP or HTTPS port.',
  );

export function normalizeTarget(input: string): URL {
  const hasControl = [...input].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || (code >= 127 && code <= 159);
  });
  if (input.length > 2048 || /[\s\\]/u.test(input) || hasControl || !/^https?:\/\//i.test(input))
    throw denied();
  const authority = input.slice(input.indexOf('://') + 3).split(/[/?#]/)[0] ?? '';
  if (/[@%]/.test(authority)) throw denied();
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw denied();
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port)
    throw denied();
  // WHATWG parsing canonicalizes decimal/octal/hex IPv4 before this check.
  if (isIP(url.hostname.replace(/^\[|\]$/g, ''))) throw denied();
  const hostname = url.hostname.replace(/\.$/, '');
  if (
    hostname.length > 253 ||
    !hostname.includes('.') ||
    hostname.split('.').some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
    /(?:^|\.)(?:localhost|local|internal|test|invalid|example|arpa|onion|home|lan)$/.test(hostname)
  )
    throw denied();
  url.hostname = hostname;
  url.hash = '';
  if (url.href.length > 2048) throw denied();
  return url;
}
export function isPublicAddress(address: string): boolean {
  try {
    if (address.includes('%')) return false;
    const ip = ipaddr.process(address);
    if (ip.range() !== 'unicast') return false;
    if (ip.kind() === 'ipv4') {
      const v4 = ip as ipaddr.IPv4;
      if (
        [
          ['198.18.0.0', 15],
          ['192.0.0.0', 24],
          ['192.88.99.0', 24],
        ].some(([network, prefix]) => v4.match(ipaddr.IPv4.parse(String(network)), Number(prefix)))
      )
        return false;
    }
    // IPv6 must be global unicast; exclude documentation and transition space.
    if (ip.kind() === 'ipv6') {
      const v6 = ip as ipaddr.IPv6;
      return (
        v6.match(ipaddr.IPv6.parse('2000::'), 3) &&
        !v6.match(ipaddr.IPv6.parse('2001::'), 23) &&
        !v6.match(ipaddr.IPv6.parse('2002::'), 16) &&
        !v6.match(ipaddr.IPv6.parse('3fff::'), 20)
      );
    }
    return true;
  } catch {
    return false;
  }
}

export function createUrlPolicy(
  allowedHosts: readonly string[],
  resolve: DnsResolver = resolveAddresses,
) {
  // Invalid configuration fails closed, including wildcards, URLs and ports.
  const approved = new Set(
    allowedHosts
      .map((host) => {
        try {
          const url = normalizeTarget(`https://${host}`);
          return url.host === host && url.pathname === '/' ? host : '';
        } catch {
          return '';
        }
      })
      .filter(Boolean),
  );
  let activeLookups = 0;
  return async (input: string): Promise<string> => {
    if (!approved.size)
      throw new AppError(
        503,
        'INTAKE_NOT_CONFIGURED',
        'URL intake is disabled. Configure SCAN_ALLOWED_HOSTS with approved public hosts.',
      );
    const url = normalizeTarget(input);
    if (!approved.has(url.hostname)) throw denied();
    if (activeLookups >= 8)
      throw new AppError(
        503,
        'DNS_LOOKUP_FAILED',
        'URL validation is busy. Please try again shortly.',
      );
    activeLookups++;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // A timed-out lookup keeps its slot until the underlying resolver settles.
      const addresses = await Promise.race([
        Promise.resolve()
          .then(() => resolve(url.hostname))
          .finally(() => {
            activeLookups--;
          }),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error()), 3000);
        }),
      ]);
      if (!addresses.length || addresses.length > 64 || !addresses.every(isPublicAddress))
        throw denied();
      return url.href;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        503,
        'DNS_LOOKUP_FAILED',
        'The website address could not be safely resolved. Try again later.',
      );
    } finally {
      if (timer) clearTimeout(timer);
    }
  };
}
