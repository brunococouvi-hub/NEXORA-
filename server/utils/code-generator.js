const crypto = require('crypto');

const CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function randomCharacters(length) {
  const bytes = crypto.randomBytes(length);
  let result = '';

  for (let i = 0; i < length; i++) {
    result += CHARACTERS[bytes[i] % CHARACTERS.length];
  }

  return result;
}

function generateCode() {
  if (crypto.randomInt(0, 2) === 0) {
    const blocks = [];

    for (let i = 0; i < 4; i++) {
      blocks.push(randomCharacters(4));
    }

    return blocks.join('-');
  }

  return randomCharacters(24);
}

module.exports = {
  generateCode
};
