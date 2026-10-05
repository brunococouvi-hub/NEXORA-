const crypto = require('crypto');

const CHARACTERS =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function randomPart(length) {
  let result = '';

  for (let i = 0; i < length; i++) {
    result += CHARACTERS[
      crypto.randomInt(0, CHARACTERS.length)
    ];
  }

  return result;
}

function generateAdminCode() {
  return `NX-${randomPart(6)}-${randomPart(6)}-${randomPart(6)}`;
}

function hashAdminCode(code) {
  return crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');
}

module.exports = {
  generateAdminCode,
  hashAdminCode
};
