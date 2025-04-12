const sequelize = require('../config/database');

const User = require('./UserModel');
const Folder = require('./FolderModel');
const Files = require('./FileModel');


User.hasMany(Folder, { foreignKey: 'user_id' });
Folder.belongsTo(User, { foreignKey: 'user_id' });

Folder.hasMany(Files, { foreignKey: 'folder_id' });
Files.belongsTo(Folder, { foreignKey: 'folder_id' });

module.exports = { sequelize, User, Folder, Files };