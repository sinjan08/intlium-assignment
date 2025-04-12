const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const fileController = require('../controllers/fileController');
const { upload } = require('../utils/fileUploader');

router.post('/create', upload.single('file'), validate, fileController.createFile);

module.exports = router;