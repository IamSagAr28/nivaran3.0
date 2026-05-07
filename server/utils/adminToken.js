const crypto = require('crypto');

function base64urlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64urlDecodeToString(b64url) {
  const padded = String(b64url)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLen);
  return Buffer.from(base64, 'base64').toString('utf8');
}

function timingSafeEqualString(a, b) {
  const aBuf = Buffer.from(String(a), 'utf8');
  const bBuf = Buffer.from(String(b), 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function getAdminTokenSecret() {
  return (
    process.env.ADMIN_TOKEN_SECRET ||
    process.env.SESSION_KEY ||
    'dev_admin_token_secret_change_me'
  );
}

function signAdminToken({ adminId, username, ttlSeconds = 24 * 60 * 60 }) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    adminId: Number(adminId),
    username: username || undefined,
    iat: now,
    exp: now + Number(ttlSeconds || 0),
  };

  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const sig = crypto
    .createHmac('sha256', getAdminTokenSecret())
    .update(payloadB64)
    .digest('hex');

  return `${payloadB64}.${sig}`;
}

function verifyAdminToken(token) {
  try {
    const raw = String(token || '');
    const parts = raw.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, sig] = parts;
    if (!payloadB64 || !sig) return null;

    const expectedSig = crypto
      .createHmac('sha256', getAdminTokenSecret())
      .update(payloadB64)
      .digest('hex');

    if (!timingSafeEqualString(sig, expectedSig)) return null;

    const payloadJson = base64urlDecodeToString(payloadB64);
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);

    if (!payload || typeof payload !== 'object') return null;
    if (typeof payload.exp !== 'number' || payload.exp < now) return null;
    if (typeof payload.adminId !== 'number' || !Number.isFinite(payload.adminId)) return null;

    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  getAdminTokenSecret,
  signAdminToken,
  verifyAdminToken,
};
