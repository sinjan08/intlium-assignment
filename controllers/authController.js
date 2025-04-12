const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();
const responder = require('../utils/helper');
const dayjs = require('dayjs');

exports.register = async (req, res) => {
    try {
        const { name, email, password, profile_image } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const user = await User.create({ name, email, password: hashed, profile_image, createdAt });
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
        const { password: hashedPassword, created_at, updated_at, ...userData } = user.toJSON();
        return responder.respond(res, true, 201, 'User created successfully', { ...userData, token });
    } catch (err) {
        console.log(err);
        return responder.respond(res, false, 500, 'An error occurred: ' + err.message);
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return responder.respond(res, false, 401, 'Invalid credentials');
        }
        const { password: userPassword, created_at, updated_at, ...userData } = user.toJSON();
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
        return responder.respond(res, true, 200, 'User logged in successfully', { ...userData, token });
    } catch (err) {
        console.log(err);
        return responder.respond(res, false, 500, 'An error occurred: ' + err.message);
    }
};