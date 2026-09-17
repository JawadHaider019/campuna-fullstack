import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter for Images only
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);

    if (ext && mime) {
        cb(null, true);
    } else {
        cb(new Error('Nur Bilder (jpeg, jpg, png, webp, gif) sind erlaubt!'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter
});

export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 10);

export const uploadSingleSafe = (req, res, next) => {
    uploadSingle(req, res, (err) => {
        if (err) {
            console.error('Upload middleware error:', err.message);
            return res.status(400).json({
                success: false,
                message: err.message || 'Fehler beim Hochladen der Datei.'
            });
        }
        next();
    });
};
