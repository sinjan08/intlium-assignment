const Folder = require('../models/FolderModel');
const Files = require('../models/FileModel');
const { respond } = require('../utils/helper');
const dayjs = require('dayjs');

const currentDateTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

exports.createFile = async (req, res) => {
    try {
        const { name, parent_id } = req.body;

        const folder = await Folder.create({ name, parent_id, user_id: req.user.id, created_at: currentDateTime });
        const { id, name: folderName, parent_id: parentFolder, user_id } = folder.toJSON();
        return respond(res, true, 201, 'Folder created successfully', { id, name: folderName, parent_id: parentFolder, user_id });
    } catch (err) {
        console.log(err);
        return respond(res, false, 500, 'An error occurred: ' + err.message);
    }
};


exports.getParentFolders = async (req, res) => {
    try {
        const parentFolders = await Folder.findAll({ where: { parent_id: null } });
        return respond(res, true, 200, 'Parent folders found successfully', parentFolders);
    } catch (err) {
        console.log(err);
        return respond(res, false, 500, 'An error occurred: ' + err.message);
    }
};


exports.getFileAndFolders = async (req, res) => {
    try {
        const { id, orderBy, oredrDir } = req.params;
        const sortCol = orderBy || 'name';
        const sortDir = oredrDir || 'ASC';
        const folderWithFiles = await Folder.findAll({
            where: {
                parent_id: id,
                is_deleted: false,
                is_active: true
            },
            include: [
                {
                    model: Files,
                    as: 'files',
                    where: {
                        is_deleted: false,
                        is_active: true
                    },
                    required: false
                }
            ],
            order: [[sortCol, sortDir]]
        });

        if (!folderWithFiles || folderWithFiles.length === 0) {
            return respond(res, false, 404, 'No file or folder found');
        }

        return respond(res, true, 200, 'Folder and files retrieved successfully', folderWithFiles);
    } catch (err) {
        console.log(err);
        return respond(res, false, 500, 'An error occurred: ' + err.message);
    }
};


exports.updateFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const folder = await Folder.findByPk(id);
        if (!folder) {
            return respond(res, false, 404, 'Folder not found');
        }
        folder.name = name;
        folder.updated_at = currentDateTime;
        await folder.save();
        const { parent_id, user_id } = folder.toJSON();
        return respond(res, true, 200, 'Folder updated successfully', { id, name, parent_id, user_id });
    } catch (err) {
        console.log(err);
        return respond(res, false, 500, 'An error occurred: ' + err.message);
    }
};


exports.trashFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const folder = await Folder.findByPk(id);
        if (!folder) {
            return respond(res, 422, 'Folder not found');
        }
        folder.is_deleted = true;
        folder.is_active = false;
        folder.deleted_at = dayjs().format('YYYY-MM-DD HH:mm:ss');
        await folder.save();
        return respond(res, true, 200, 'Folder trashed successfully');
    } catch (err) {
        return respond(res, false, 500, "An error occurred: " + err.message);
    }
}


exports.deleteFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const folder = await Folder.findByPk(id);
        if (!folder) {
            return respond(res, false, 404, 'Folder not found');
        }
        await folder.destroy();
        return respond(res, true, 200, 'Folder deleted successfully');
    } catch (err) {
        console.log(err);
        return respond(res, false, 500, 'An error occurred: ' + err.message);
    }
};