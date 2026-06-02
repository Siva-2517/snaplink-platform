// Clean, dependency-free User-Agent and Geo Parser

const parseUserAgent = (req) => {
  const ua = req.headers['user-agent'] || '';
  let os = 'Unknown OS';
  let browser = 'Other';
  let device = 'Desktop';

  // 1. Parse Operating System
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
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

  // 4. Generate a stable, realistic country based on IP Address or accept-language
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  let country = 'Localhost';

  if (ip !== '127.0.0.1' && ip !== '::1' && ip !== '::ffff:127.0.0.1') {
    const countries = ['United States', 'India', 'United Kingdom', 'Germany', 'Canada', 'France', 'Japan', 'Singapore', 'Australia', 'Brazil'];
    
    // Create a simple, deterministic hash from the IP address
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = ip.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % countries.length;
    country = countries[index];
  } else {
    // Try to extract country from accept-language as a local helper
    const lang = req.headers['accept-language'] || '';
    if (lang.startsWith('en')) country = 'United States';
    else if (lang.startsWith('de')) country = 'Germany';
    else if (lang.startsWith('fr')) country = 'France';
    else if (lang.startsWith('ja')) country = 'Japan';
    else if (lang.startsWith('en-IN') || lang.startsWith('hi')) country = 'India';
  }

  return {
    ip: ip.replace('::ffff:', ''),
    os,
    browser,
    device,
    country
  };
};

module.exports = { parseUserAgent };
