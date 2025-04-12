const express = require('express');
const passport = require('passport');
const router = express.Router();

const authRoutes = require('./authRoutes');
const folderRoutes = require('./folderRoutes');
const authentication = require('../middleware/authentication');

router.use('/auth', authRoutes);
router.use('/folders', authentication, folderRoutes);

module.exports = router;