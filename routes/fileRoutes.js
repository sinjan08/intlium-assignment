const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const fileController = require('../controllers/fileController');
const { upload } = require('../utils/fileUploader');

router.post('/create', upload.single('file'), validate, fileController.createFile);
router.put('/update/:id', upload.single('file'), validate, fileController.updateFile);
router.delete('/delete/:id', validate, fileController.deleteFile);
router.put('/delete/:id', validate, fileController.trashFile);

module.exports = router;