const cookieSession = require('cookie-session');

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_KEY) {
  throw new Error('SESSION_KEY must be set in production for secure sessions');
}

const isProduction = process.env.NODE_ENV === 'production';
const allowInsecureCookies =
  process.env.LOCAL_DEV === 'true' || process.env.ALLOW_INSECURE_COOKIES === 'true';
const useSecureCookie = isProduction && !allowInsecureCookies;

const sessionMiddleware = cookieSession({
  name: 'nivaran_session',
  keys: [process.env.SESSION_KEY || 'secret_key_change_me'],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: useSecureCookie, // Allow insecure cookies for local dev when configured
  httpOnly: true, // Secure, no JS access
  sameSite: useSecureCookie ? 'none' : 'lax', // 'none' required for cross-domain
});

module.exports = sessionMiddleware;
