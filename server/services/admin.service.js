const fs = require('fs');
const path = require('path');
const {
  generateAdminCode,
  hashAdminCode
} = require('../utils/admin-code');

const FILE = path.join(__dirname, '../../data/admins.json');

function readAdmins() {
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function saveAdmins(admins) {
  fs.writeFileSync(FILE, JSON.stringify(admins, null, 2));
}

function createOwnerCode() {
  const admins = readAdmins();
  const code = generateAdminCode();

  admins.owner.codeHash = hashAdminCode(code);
  admins.owner.active = true;

  saveAdmins(admins);

  return code;
}

function verifyOwnerCode(code) {
  const admins = readAdmins();
  const hash = hashAdminCode(code);

  return Boolean(
    admins.owner &&
    admins.owner.active &&
    admins.owner.codeHash === hash
  );
}

function verifySecondaryCode(code) {
  const admins = readAdmins();
  const hash = hashAdminCode(code);

  for (const slot of ['admin2', 'admin3']) {
    const admin = admins[slot];

    if (
      admin &&
      admin.active &&
      admin.codeHash &&
      admin.codeHash === hash
    ) {
      return slot;
    }
  }

  return null;
}

function generateSecondaryCode(slot) {
  if (!['admin2', 'admin3'].includes(slot)) {
    throw new Error('Slot administrateur invalide.');
  }

  const admins = readAdmins();
  const admin = admins[slot];

  if (!admin) {
    throw new Error('Administrateur introuvable.');
  }

  if (
    admin.lastGeneratedAt &&
    Date.now() - new Date(admin.lastGeneratedAt).getTime() <
      30 * 24 * 60 * 60 * 1000
  ) {
    throw new Error(
      'Ce slot doit attendre 30 jours avant une nouvelle génération.'
    );
  }

  const code = generateAdminCode();

  admin.codeHash = hashAdminCode(code);
  admin.lastGeneratedAt = new Date().toISOString();
  admin.active = true;

  saveAdmins(admins);

  return code;
}

function setActive(slot, active) {
  if (!['admin2', 'admin3'].includes(slot)) {
    throw new Error('Slot administrateur invalide.');
  }

  const admins = readAdmins();

  if (!admins[slot]) {
    throw new Error('Administrateur introuvable.');
  }

  admins[slot].active = Boolean(active);

  saveAdmins(admins);
}

function getSecondaryAdmins() {
  const admins = readAdmins();

  return ['admin2', 'admin3'].map(slot => {
    const admin = admins[slot];

    return {
      slot,
      active: Boolean(admin?.active),
      lastGeneratedAt: admin?.lastGeneratedAt || null,
      activatedAt: admin?.activatedAt || null
    };
  });
}

module.exports = {
  createOwnerCode,
  verifyOwnerCode,
  verifySecondaryCode,
  generateSecondaryCode,
  setActive,
  getSecondaryAdmins
};
