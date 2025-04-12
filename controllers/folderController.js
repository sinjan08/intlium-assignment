const Folder = require('../models/FolderModel');
const Files = require('../models/FileModel');
const { respond } = require('../utils/helper');
const dayjs = require('dayjs');
const { getFolderPath } = require('../utils/fileUploader');
const { sequelize } = require('../models');

const currentDateTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

exports.createFolder = async (req, res) => {
    try {
        const { name, parent_id } = req.body;

        const folder = await Folder.create({ name, parent_id, user_id: req.user.id, created_at: currentDateTime });
        if (!folder) return respond(res, false, 500, 'Folder can not be created');

        let folderPath = 'uploads/' + folder.name;

        if (parent_id !== null && parent_id !== undefined) {
            folderPath = await getFolderPath(parent_id);
        }

        fs.mkdir(folderPath, { recursive: true }, (err) => {
            if (err) {
                return respond(res, false, 500, 'Folder can not be created: ' + err.message);
            }
        });

        const { id, name: folderName, parent_id: parentFolder, user_id } = folder.toJSON();
        return respond(res, true, 201, 'Folder created successfully', { id, name: folderName, parent_id: parentFolder, user_id });
    } catch (err) {
        console.log(err);
        return respond(res, false, 500, 'An error occurred: ' + err.message);
    }
};


exports.getParentFolders = async (req, res) => {
    try {
        const parentFolders = await Folder.findAll({
            where: {
                parent_id: null,
                is_deleted: false,
                is_active: true
            },
            order: [['name', 'ASC']]
        });

        const cleanedData = parentFolders.map(folder => {
            return {
                id: folder.id,
                name: folder.name,
                user_id: folder.user_id,
                created_at: dayjs(folder.created_at).format('YYYY-MM-DD HH:mm:ss')
            };
        });

        return respond(res, true, 200, 'Parent folders found successfully', cleanedData);
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
        const [folderWithFiles] = await sequelize.query(`
            SELECT * FROM (
                SELECT 
                    id, 
                    name, 
                    created_at, 
                    FALSE AS isFile 
                FROM folders 
                WHERE parent_id = :id 
                    AND is_deleted = FALSE 
                    AND is_active = TRUE
        
                UNION ALL
        
                SELECT 
                    id, 
                    name, 
                    created_at, 
                    TRUE AS isFile 
                FROM files 
                WHERE folder_id = :id 
                    AND is_deleted = FALSE 
                    AND is_active = TRUE
            ) AS combined
             ORDER BY ${sortCol} ${sortDir}
        `, {
            replacements: { id },
        });

        if (!folderWithFiles || folderWithFiles.length === 0) {
            return respond(res, false, 404, 'No file or folder found');
        }

        // Clean up and transform the data
        const cleanedData = folderWithFiles.map(folder => ({
            id: folder.id,
            name: folder.name,
            is_file: folder.isFile,
            created_at: dayjs(folder.created_at).format('YYYY-MM-DD HH:mm:ss'),
        }));

        // Separate folders and files
        const folders = cleanedData.filter(item => !item.is_file);
        const files = cleanedData.filter(item => item.is_file);

        return respond(res, true, 200, 'Folder and files retrieved successfully', { folders, files });
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

        let currentFolderPath = 'uploads/' + folder.name;
        let folderPath = 'uploads/' + name;
        if (folder.parent_id !== null && folder.parent_id !== undefined) {
            currentFolderPath = await getFolderPath(folder.parent_id);
            const parentPath = path.posix.dirname(currentFolderPath);
            folderPath = path.posix.join(parentPath, name);
        }

        fs.renameSync(currentFolderPath, folderPath, function (err) {
            if (err) return respond(res, false, 500, 'Folder can not be renamed: ' + err.message);
        });

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


        let currentFolderPath = 'uploads/' + folder.name;
        let folderPath = 'uploads/trash/' + folder.name;

        if (folder.parent_id !== null && folder.parent_id !== undefined) {
            currentFolderPath = await getFolderPath(folder.parent_id);
        }

        fs.renameSync(currentFolderPath, folderPath, function (err) {
            if (err) return respond(res, false, 500, 'Folder can not be trashed: ' + err.message);
        });

        folder.is_deleted = true;
        folder.is_active = false;
        folder.deleted_at = currentDateTime;
        await folder.save();

        const files = await Files.findAll({ where: { folder_id: id } });
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                files[i].is_deleted = true;
                files[i].is_active = false;
                files[i].deleted_at = currentDateTime;
                await files[i].save();
            }
        }

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

        let currentFolderPath = 'uploads/' + folder.name;
        if (folder.parent_id !== null && folder.parent_id !== undefined) {
            currentFolderPath = await getFolderPath(folder.parent_id);
        }

        fs.unlinkSync(currentFolderPath, (err) => {
            if (err) return respond(res, false, 500, 'Folder can not be deleted: ' + err.message);
        });

        await folder.destroy();
        const files = await Files.findAll({ where: { folder_id: id } });
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                files[i].is_deleted = true;
                files[i].is_active = false;
                files[i].deleted_at = currentDateTime;
                await files[i].destroy();
            }
        }

        return respond(res, true, 200, 'Folder deleted successfully');
    } catch (err) {
        console.log(err);
        return respond(res, false, 500, 'An error occurred: ' + err.message);
    }
};