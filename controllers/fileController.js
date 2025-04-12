const Folder = require('../models/FolderModel');
const Files = require('../models/FileModel');
const { respond } = require('../utils/helper');
const dayjs = require('dayjs');
const path = require('path');
const { prepareFileStoragePath } = require('../utils/fileUploader');
const fs = require('fs');



const currentDateTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

exports.createFile = async (req, res) => {
    try {
        const { folder_id } = req.body;
        if (req.file) {
            const { relativePath } = await prepareFileStoragePath(folder_id);
            const file = req.file;
            const filePath = path.posix.join(relativePath, file.filename);

            if (!filePath) {
                return respond(res, false, 422, 'Failed to upload file.');
            }

            newFileData = {
                name: file.filename,
                path: filePath,
                type: file.mimetype,
                size: file.size,
                user_id: req.user.id,
                created_at: currentDateTime
            };

            if (folder_id) {
                newFileData.folder_id = folder_id;
            }

            const newFile = Files.create(newFileData);

            if (!newFile) {
                return respond(res, false, 422, 'Failed to save file info.');
            }

            newFileData.id = newFile.id;
            return respond(res, true, 201, "File uploaded successfully", { newFileData });
        } else {
            return respond(res, false, 422, 'File not found');
        }
    } catch (err) {
        console.error(err);
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


exports.updateFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const file = await Files.findByPk(id);
        if (!file) {
            return respond(res, false, 404, 'File not found');
        }

        filePath = file.path;
        actualFolderPath = path.dirname(filePath);
        newfilePath = actualFolderPath + "/" + name;

        fs.renameSync(filePath, newfilePath, function (err) {
            if (err) return respond(res, false, 500, 'File can not be renamed: ' + err.message);
        });

        file.name = name;
        file.updated_at = currentDateTime;
        await file.save();
        const { name: fileName, path, type, size, folder_id, user_id } = folder.toJSON();
        return respond(res, true, 200, 'File updated successfully', { id, name: fileName, path, type, size, folder_id, user_id });
    } catch (err) {
        console.log(err);
        return respond(res, false, 500, 'An error occurred: ' + err.message);
    }
};


exports.trashFile = async (req, res) => {
    try {
        const { id } = req.params;
        const file = await Files.findByPk(id);
        if (!file) {
            return respond(res, 422, 'Folder not found');
        }

        filePath = file.path;
        actualFolderPath = path.dirname(filePath);
        newfilePath = "uploads/trash/" + file.name;

        fs.renameSync(filePath, newfilePath, function (err) {
            if (err) return respond(res, false, 500, 'File can not be trashed: ' + err.message);
        });

        file.is_deleted = true;
        file.is_active = false;
        file.deleted_at = dayjs().format('YYYY-MM-DD HH:mm:ss');
        await file.save();
        return respond(res, true, 200, 'Folder trashed successfully');
    } catch (err) {
        return respond(res, false, 500, "An error occurred: " + err.message);
    }
}


exports.deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const file = await Files.findByPk(id);
        if (!file) {
            return respond(res, false, 404, 'Folder not found');
        }

        fs.unlinkSync(file.path, (err) => {
            if (err) return respond(res, false, 500, 'File can not be deleted: ' + err.message);
        });

        await file.destroy();
        return respond(res, true, 200, 'Folder deleted successfully');
    } catch (err) {
        console.log(err);
        return respond(res, false, 500, 'An error occurred: ' + err.message);
    }
};