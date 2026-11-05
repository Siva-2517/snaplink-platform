const geoip = require('geoip-lite');

let regionNames;
try {
  regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
} catch (e) {
  regionNames = null;
}

const getCountryName = (code) => {
  if (!code || typeof code !== 'string') return null;
  const upper = code.trim().toUpperCase();
  if (upper === 'XX' || upper === 'T1') return 'Unknown';
  try {
    return regionNames ? regionNames.of(upper) || upper : upper;
  } catch (err) {
    return upper;
  }
};

const isPrivateOrLocalIp = (ip) => {
  if (!ip) return true;
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
    ip === 'localhost'
  );
};

const parseUserAgent = (req) => {
  const ua = req.headers['user-agent'] || '';
  let os = 'Unknown OS';
  let browser = 'Other';
  let device = 'Desktop';

  // 1. Parse Operating System (check mobile/iOS before macOS since iOS UAs contain "like Mac OS X")
  if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // 2. Parse Device Classification
  if (/ipad/i.test(ua)) {
    device = 'Tablet';
  } else if (/mobile|iphone|android/i.test(ua)) {
    device = 'Mobile';
  }

  // 3. Parse Browser Engine
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';

  // 4. Resolve Client IP
  const rawIp =
    req.headers['x-forwarded-for'] ||
    req.ip ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  const cleanIp = (rawIp.split(',')[0].trim()).replace('::ffff:', '');

  // 5. Resolve Country (Edge CDN headers -> GeoIP database lookup -> Local fallback)
  let country = null;

  // Check edge/proxy CDN headers first
  const cdnCountryHeader =
    req.headers['cf-ipcountry'] ||
    req.headers['x-vercel-ip-country'] ||
    req.headers['cloudfront-viewer-country'];

  if (cdnCountryHeader) {
    country = getCountryName(cdnCountryHeader);
  }

  // If no CDN header, query offline geoip-lite lookup
  if (!country && !isPrivateOrLocalIp(cleanIp)) {
    try {
      const geo = geoip.lookup(cleanIp);
      if (geo && geo.country) {
        country = getCountryName(geo.country);
      }
    } catch (err) {
      console.warn('GeoIP lookup error:', err.message);
    }
  }

  // Local / Private / Unknown Fallbacks
  if (!country) {
    if (isPrivateOrLocalIp(cleanIp)) {
      country = 'Localhost';
    } else {
      country = 'Unknown';
    }
  }

  return {
    ip: cleanIp,
    os,
    browser,
    device,
    country
  };
};

module.exports = { parseUserAgent };
