const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 20,
    fileSize: 500 * 1024 * 1024
  }
});



router.post('/cover-url', requireAdmin, async (req,res)=>{
  try{
    const {file_key}=req.body;

    if(!file_key){
      return res.status(400).json({
        success:false,
        message:'Référence de couverture manquante.'
      });
    }

    const {data,error}=await supabase.storage
      .from('nexora-media')
      .createSignedUrl(file_key, 60 * 60 * 24 * 365);

    if(error) throw error;

    res.json({
      success:true,
      url:data.signedUrl
    });
  }catch(error){
    console.error('COVER URL:',error.message);
    res.status(500).json({
      success:false,
      message:'Impossible de préparer la couverture.'
    });
  }
});

router.post('/cover', requireAdmin, upload.single('cover'), async (req,res)=>{
  try{
    if(!req.file){
      return res.status(400).json({
        success:false,
        message:'Aucune image reçue.'
      });
    }

    const ext=path.extname(req.file.originalname);
    const key=`covers/${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`;

    const {error}=await supabase.storage
      .from('nexora-media')
      .upload(key, req.file.buffer, {
        contentType:req.file.mimetype,
        upsert:false
      });

    if(error) throw error;

    res.status(201).json({
      success:true,
      file_key:key
    });
  }catch(error){
    console.error('UPLOAD COVER:',error.message);
    res.status(500).json({
      success:false,
      message:'Échec de l’importation de la couverture.'
    });
  }
});

router.post('/media', requireAdmin, upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier reçu.'
      });
    }

    const uploaded = [];

    for (const file of req.files) {
      const extension = path.extname(file.originalname);
      const safeName = crypto.randomBytes(16).toString('hex');
      const fileKey = `media/${Date.now()}-${safeName}${extension}`;

      const { error } = await supabase.storage
        .from('nexora-media')
        .upload(fileKey, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) throw error;

      uploaded.push({
        file_key: fileKey,
        original_name: file.originalname,
        display_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size
      });
    }

    res.status(201).json({
      success: true,
      files: uploaded
    });

  } catch (error) {
    console.error('UPLOAD MEDIA:', error.message);

    res.status(500).json({
      success: false,
      message: 'Échec de l’upload.'
    });
  }
});

module.exports = router;
