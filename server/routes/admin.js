const express = require('express');

const {
  requireAdmin,
  requireOwner
} = require('../middleware/admin');

const {
  generateSecondaryCode,
  setActive,
  getSecondaryAdmins
} = require('../services/admin.service');

const router = express.Router();

router.get('/admins', requireAdmin, requireOwner, (req, res) => {
  try {
    res.json({
      success: true,
      admins: getSecondaryAdmins()
    });
  } catch (error) {
    console.error('ADMIN LIST:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de charger les administrateurs.'
    });
  }
});

router.post('/admins/:slot/generate', requireAdmin, requireOwner, (req, res) => {
  try {
    const { slot } = req.params;

    const code = generateSecondaryCode(slot);

    res.json({
      success: true,
      slot,
      code
    });
  } catch (error) {
    console.error('ADMIN CODE:', error.message);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/admins/:slot/status', requireAdmin, requireOwner, (req, res) => {
  try {
    const { slot } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide.'
      });
    }

    setActive(slot, active);

    res.json({
      success: true,
      slot,
      active
    });
  } catch (error) {
    console.error('ADMIN STATUS:', error.message);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
