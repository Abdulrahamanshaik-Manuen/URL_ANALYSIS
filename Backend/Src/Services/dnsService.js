import dns from 'dns';
import { performance } from 'perf_hooks';
import logger from '../Utils/logger.js';

const dnsPromises = dns.promises;

/**
 * Performs complete DNS inspection for a given hostname
 * @param {string} hostname
 * @returns {Promise<object>}
 */

export async function checkDns(hostname) {
  const result = {
    resolved: false,
    hostname,
    responseTimeMs: 0,
    records: {
      a: [],
      aaaa: [],
      cname: [],
      mx: [],
      ns: [],
      txt: [],
      caa: [],
      soa: null
    },
    dnssec: false,
    errors: {}
  };

  const startTime = performance.now();

  // Helper to safely execute a DNS query without throwing
  const safeResolve = async (type, fn) => {
    try {
      const data = await fn();
      return data;
    } catch (err) {
      if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') {
        result.errors[type] = err.code || err.message;
      }
      return null;
    }
  };

  try {
    const [a, aaaa, cname, mx, ns, txt, caa, soa] = await Promise.all([
      safeResolve('A', () => dnsPromises.resolve4(hostname)),
      safeResolve('AAAA', () => dnsPromises.resolve6(hostname)),
      safeResolve('CNAME', () => dnsPromises.resolveCname(hostname)),
      safeResolve('MX', () => dnsPromises.resolveMx(hostname)),
      safeResolve('NS', () => dnsPromises.resolveNs(hostname)),
      safeResolve('TXT', () => dnsPromises.resolveTxt(hostname)),
      safeResolve('CAA', () => dnsPromises.resolveCaa(hostname)),
      safeResolve('SOA', () => dnsPromises.resolveSoa(hostname))
    ]);

    result.responseTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    if (a && a.length > 0) result.records.a = a;
    if (aaaa && aaaa.length > 0) result.records.aaaa = aaaa;
    if (cname && cname.length > 0) result.records.cname = cname;
    if (mx && mx.length > 0) {
      result.records.mx = mx.sort((x, y) => x.priority - y.priority);
    }
    if (ns && ns.length > 0) result.records.ns = ns;
    if (txt && txt.length > 0) {
      // Flatten TXT arrays
      result.records.txt = txt.map(entry => Array.isArray(entry) ? entry.join('') : entry);
    }
    if (caa && caa.length > 0) result.records.caa = caa;
    if (soa) result.records.soa = soa;

    result.resolved = (a && a.length > 0) || (aaaa && aaaa.length > 0) || (cname && cname.length > 0);

    // Quick DNSSEC indicator check via SOA / CAA presence
    result.dnssec = !!(result.records.caa.length > 0 || (result.records.soa && result.records.soa.minttl));

  } catch (err) {
    result.responseTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
    result.error = err.message || 'DNS resolution failed';
    logger.warn(`DNS check failed for ${hostname}: ${err.message}`);
  }

  return result;
}

export default {
  checkDns
};

