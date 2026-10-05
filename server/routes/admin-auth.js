const express = require('express');

const {
  verifyOwnerCode,
  verifySecondaryCode
} = require('../services/admin.service');

const {
  createSession
} = require('../middleware/admin');

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Code administrateur requis.'
      });
    }

    const cleanCode = code.trim();

    let slot = null;

    if (verifyOwnerCode(cleanCode)) {
      slot = 'owner';
    } else {
      slot = verifySecondaryCode(cleanCode);
    }

    if (!slot) {
      return res.status(401).json({
        success: false,
        message: 'Code invalide ou administrateur désactivé.'
      });
    }

    const token = createSession(slot);

    res.cookie('nexora_admin_session', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/'
    });

    res.json({
      success: true,
      slot
    });

  } catch (error) {
    console.error('ADMIN LOGIN:', error.message);

    res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('nexora_admin_session', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });

  res.json({
    success: true
  });
});

module.exports = router;
