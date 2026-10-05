const crypto = require('crypto');

function createSession(slot) {
  const payload = {
    slot,
    exp: Date.now() + 8 * 60 * 60 * 1000,
    nonce: crypto.randomBytes(24).toString('hex')
  };

  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', process.env.NEXORA_SESSION_SECRET)
    .update(data)
    .digest('base64url');

  return `${data}.${signature}`;
}

function verifySession(token) {
  if (!token || !process.env.NEXORA_SESSION_SECRET) {
    return null;
  }

  const parts = token.split('.');

  if (parts.length !== 2) {
    return null;
  }

  const [data, signature] = parts;

  const expected = crypto
    .createHmac('sha256', process.env.NEXORA_SESSION_SECRET)
    .update(data)
    .digest('base64url');

  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8')
    );

    if (!payload.slot || Date.now() >= payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.nexora_admin_session;
  const session = verifySession(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Accès administrateur requis.'
    });
  }

  req.admin = session;
  next();
}

function requireOwner(req, res, next) {
  if (!req.admin || req.admin.slot !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé à l’Owner.'
    });
  }
  next();
}

module.exports = {
  createSession,
  verifySession,
  requireAdmin,
  requireOwner
};
