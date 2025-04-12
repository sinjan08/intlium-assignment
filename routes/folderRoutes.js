const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const folderController = require('../controllers/folderController');
const { validateCreateFolder } = require('../controllers/rules/folderRule');

router.post('/create', validateCreateFolder, validate, folderController.createFolder);
router.put('/update/:id', validateCreateFolder, validate, folderController.updateFolder);
router.put('/delete/:id', validate, folderController.trashFolder);
router.delete('/delete/:id', validate, folderController.deleteFolder);
router.get('/parent', folderController.getParentFolders);
router.get('/fetch/:id', folderController.getFileAndFolders);
router.get('/:id', folderController.getFileAndFolders);

module.exports = router;