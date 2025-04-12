const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const Files = require('../models/FileModel');
const Folder = require('../models/FolderModel');

const getFolderPath = async (folderId) => {
    try {
        const [results] = await sequelize.query(`
            WITH RECURSIVE folder_tree AS (
                SELECT id, name, parent_id
                FROM folders
                WHERE id = :folderId
                UNION ALL
                SELECT f.id, f.name, f.parent_id
                FROM folders f
                INNER JOIN folder_tree ft ON ft.parent_id = f.id
            )
            SELECT name FROM folder_tree ORDER BY parent_id ASC
        `, {
            replacements: { folderId },
        });

        const pathArray = results.map(row => row.name);
        return pathArray.join('/');
    } catch (error) {
        console.error('Error fetching folder path:', error);
        throw new Error('Failed to get folder path');
    }
};

const ensureDirectoryExistence = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
        } catch (error) {
            console.error('Error ensuring directory existence:', error);
            throw new Error('Failed to create directory');
        }
    }
};

const prepareFileStoragePath = async (folderId) => {
    try {
        let dynamicRelativePath = "uploads";

        if (folderId) {
            const folderPath = await getFolderPath(folderId);
            if (folderPath) {
                dynamicRelativePath = path.posix.join(dynamicRelativePath, folderPath);
            }
        }

        const absolutePath = path.resolve(dynamicRelativePath);
        ensureDirectoryExistence(absolutePath);

        return { relativePath: dynamicRelativePath, absolutePath };
    } catch (error) {
        console.error('Error preparing file storage path:', error);
        throw new Error('Failed to prepare file storage path');
    }
};


const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const folderId = req.body.folder_id;
            console.log("folder id: ", folderId);

            if (folderId === undefined || folderId === null) return cb(null, "uploads");
            const { absolutePath } = await prepareFileStoragePath(folderId);
            cb(null, absolutePath);
        } catch (error) {
            console.error('Error setting file upload destination:', error);
            cb(error, null);
        }
    },
    filename: async (req, file, cb) => {
        try {
            console.log("file originalname: ", file.originalname);

            const fileExtension = path.extname(file.originalname);
            const fileName = path.basename(file.originalname, fileExtension);
            let finalFileName = `${fileName}${fileExtension}`;

            const fileNameCount = await Files.count({ where: { name: finalFileName, folder_id: req.body.folder_id } });

            if (fileNameCount > 0) {
                finalFileName = `${fileName}(${fileNameCount})${fileExtension}`;
            }

            cb(null, finalFileName);
        } catch (error) {
            console.error('Error generating filename:', error);
            cb(error, null);
        }
    }

});


const upload = multer({ storage });

module.exports = {
    upload,
    getFolderPath,
    prepareFileStoragePath,
};
