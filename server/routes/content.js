const express = require('express');
const { generateCode } = require('../utils/code-generator');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

router.post('/create', requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description = '',
      type,
      cover_url = null,
      file_key = null,
      expires_at = null
    } = req.body;

    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: 'Titre et type obligatoires.'
      });
    }

    let code;
    let exists = true;

    while (exists) {
      code = generateCode();

      const { data, error } = await supabase
        .from('contents')
        .select('id')
        .eq('code', code)
        .maybeSingle();

      if (error) throw error;

      exists = !!data;
    }

    const { data, error } = await supabase
      .from('contents')
      .insert({
        code,
        title,
        description,
        type,
        cover_url,
        file_key,
        expires_at,
        available: true
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      code: data.code,
      content: data
    });

  } catch (error) {
    console.error('ERREUR CREATION CONTENU:', error.message);

    res.status(500).json({
      success: false,
      message: 'Impossible de créer le contenu.'
    });
  }
});

router.get('/:code', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .eq('code', req.params.code)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Code invalide ou contenu indisponible.'
      });
    }

    if (!data.available) {
      return res.status(404).json({
        success: false,
        message: 'Contenu indisponible.'
      });
    }

    if (
      data.expires_at &&
      new Date(data.expires_at) <= new Date()
    ) {
      await supabase
        .from('contents')
        .update({ available: false })
        .eq('id', data.id);

      return res.status(404).json({
        success: false,
        message: 'Ce contenu a expiré.'
      });
    }

    res.json({
      success: true,
      content: data
    });

  } catch (error) {
    console.error('ERREUR RECUPERATION CONTENU:', error.message);

    res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  }
});

module.exports = router;
