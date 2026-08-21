const tls = require('tls');
const logger = require('../Utils/logger');

/**
 * Validates whether the domain matches certificate CN or SANs (including wildcards)
 * @param {string} domain
 * @param {Array<string>} sanList
 * @param {string} cn
 * @returns {boolean}
 */
function checkDomainMatch(domain, sanList = [], cn = '') {
  const host = domain.toLowerCase();
  const allNames = [...sanList, cn].filter(Boolean).map(n => n.toLowerCase());

  for (const pattern of allNames) {
    if (pattern === host) return true;
    // Check wildcard (*.example.com)
    if (pattern.startsWith('*.')) {
      const basePattern = pattern.slice(2);
      const hostParts = host.split('.');
      if (hostParts.length > 1) {
        const hostBase = hostParts.slice(1).join('.');
        if (hostBase === basePattern) return true;
      }
    }
  }
  return false;
}

/**
 * Checks SSL/TLS certificate details for a hostname and port
 * @param {string} hostname
 * @param {number} [port=443]
 * @param {number} [timeout=10000]
 * @returns {Promise<object>}
 */
function checkSsl(hostname, port = 443, timeout = 10000) {
  return new Promise((resolve) => {
    const result = {
      valid: false,
      authorized: false,
      authorizationError: null,
      protocol: null,
      cipher: null,
      daysRemaining: null,
      validFrom: null,
      validTo: null,
      isExpired: false,
      isExpiringSoon: false,
      domainMatch: false,
      subject: {},
      issuer: {},
      san: [],
      fingerprint256: null,
      serialNumber: null,
      chainDepth: 1,
      error: null
    };

    const options = {
      host: hostname,
      port: port,
      servername: hostname, // SNI support
      rejectUnauthorized: false, // We inspect even if self-signed/invalid to report exact reason
      timeout: timeout
    };

    const socket = tls.connect(options, () => {
      try {
        const cipherObj = socket.getCipher();
        const cipherName = cipherObj ? (typeof cipherObj === 'object' ? cipherObj.name || cipherObj.standardName : String(cipherObj)) : null;
        const protocol = socket.getProtocol();

        if (!cert || Object.keys(cert).length === 0) {
          result.error = 'No certificate returned by server';
          socket.destroy();
          return resolve(result);
        }

        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const diffDays = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

        // Parse SAN
        const sanList = cert.subjectaltname
          ? cert.subjectaltname.split(',').map(s => s.trim().replace(/^DNS:/i, ''))
          : [];

        // Count chain depth
        let depth = 1;
        let current = cert;
        while (current.issuerCertificate && current.issuerCertificate !== current) {
          depth++;
          current = current.issuerCertificate;
        }

        const domainMatches = checkDomainMatch(hostname, sanList, cert.subject ? cert.subject.CN : '');

        result.valid = socket.authorized && diffDays > 0 && domainMatches;
        result.authorized = socket.authorized;
        result.authorizationError = socket.authorizationError || null;
        result.protocol = protocol;
        result.cipher = cipherName;
        result.validFrom = validFrom.toISOString();
        result.validTo = validTo.toISOString();
        result.daysRemaining = diffDays;
        result.isExpired = diffDays <= 0;
        result.isExpiringSoon = diffDays > 0 && diffDays <= 30;
        result.domainMatch = domainMatches;
        result.subject = {
          commonName: cert.subject ? cert.subject.CN : null,
          organization: cert.subject ? cert.subject.O : null,
          country: cert.subject ? cert.subject.C : null
        };
        result.issuer = {
          commonName: cert.issuer ? cert.issuer.CN : null,
          organization: cert.issuer ? cert.issuer.O : null,
          country: cert.issuer ? cert.issuer.C : null
        };
        result.san = sanList;
        result.fingerprint256 = cert.fingerprint256;
        result.serialNumber = cert.serialNumber;
        result.chainDepth = depth;

        socket.destroy();
        resolve(result);
      } catch (err) {
        result.error = err.message;
        socket.destroy();
        resolve(result);
      }
    });

    socket.on('timeout', () => {
      result.error = 'TLS connection timed out';
      socket.destroy();
      resolve(result);
    });

    socket.on('error', (err) => {
      result.error = err.message;
      socket.destroy();
      resolve(result);
    });
  });
}

module.exports = {
  checkSsl
};
