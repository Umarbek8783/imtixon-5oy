const crypto = require('crypto');

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function normalizeOtp(code) {
  return String(code || '').trim();
}

module.exports = {
  OTP_LENGTH,
  OTP_TTL_MINUTES,
  generateOtp,
  hashOtp,
  normalizeOtp,
};
