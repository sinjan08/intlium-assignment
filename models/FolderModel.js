const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Folder = sequelize.define('folders', {
    name: { type: DataTypes.STRING, allowNull: false },
    parent_id: { type: DataTypes.INTEGER, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true }
},{
    timestamps: false
});

module.exports = Folder;