const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/:code/download', async (req, res) => {
  try {
    const { data: content, error } = await supabase
      .from('contents')
      .select('*')
      .eq('code', req.params.code)
      .maybeSingle();

    if (error) throw error;

    if (!content || !content.available) {
      return res.status(404).json({
        success: false,
        message: 'Contenu indisponible.'
      });
    }

    if (
      content.expires_at &&
      new Date(content.expires_at) <= new Date()
    ) {
      return res.status(404).json({
        success: false,
        message: 'Ce contenu a expiré.'
      });
    }

    const requestedFile = req.query.file;

    if (!requestedFile) {
      return res.status(400).json({
        success: false,
        message: 'Fichier non spécifié.'
      });
    }

    let files = [];

    try {
      files = JSON.parse(content.file_key || '[]');
    } catch {
      files = [];
    }

    if (!Array.isArray(files)) {
      files = [];
    }

    const selectedFile = files.find(
      file => file.file_key === requestedFile
    );

    if (!selectedFile) {
      return res.status(404).json({
        success: false,
        message: 'Ce fichier n’existe pas dans ce contenu.'
      });
    }

    const { data, error: signedError } = await supabase.storage
      .from('nexora-media')
      .createSignedUrl(selectedFile.file_key, 15 * 60);

    if (signedError) throw signedError;

    await supabase
      .from('contents')
      .update({
        download_count: (content.download_count || 0) + 1
      })
      .eq('id', content.id);

    res.json({
      success: true,
      download_url: data.signedUrl,
      filename: selectedFile.display_name ||
                selectedFile.original_name ||
                'NEXORA-file',
      expires_in: 900
    });

  } catch (error) {
    console.error('DOWNLOAD:', error.message);

    res.status(500).json({
      success: false,
      message: 'Impossible de préparer le téléchargement.'
    });
  }
});

module.exports = router;
