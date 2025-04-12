const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../controllers/rules/authRule');

router.post('/register', validateRegistration, validate, authController.register);
router.post('/login', validateLogin, validate, authController.login);

module.exports = router;