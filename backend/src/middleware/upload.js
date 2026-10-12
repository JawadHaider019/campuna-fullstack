import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.resolve(process.cwd(), 'uploads');
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
    const allowedTypes = /jpeg|jpg|png|webp|gif|avif|heic|heif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('image/');

    if (ext || mime) {
        cb(null, true);
    } else {
        cb(new Error('Nur Bilder (jpeg, jpg, png, webp, gif, heic) sind erlaubt!'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024, files: 15 }, // 25MB limit per file, up to 15 files
    fileFilter
});

export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 15);

export const uploadSingleSafe = (req, res, next) => {
    uploadSingle(req, res, (err) => {
        if (err) {
            console.error('Upload middleware error:', err.message);
            return res.status(400).json({
                success: false,
                error: err.code === 'LIMIT_FILE_SIZE' 
                    ? 'Die Datei ist zu groß. Maximale Dateigröße ist 25 MB.' 
                    : (err.message || 'Fehler beim Hochladen der Datei.')
            });
        }
        next();
    });
};

export const uploadMultipleSafe = (req, res, next) => {
    uploadMultiple(req, res, (err) => {
        if (err) {
            console.error('Upload multiple middleware error:', err.message);
            return res.status(400).json({
                success: false,
                error: err.code === 'LIMIT_FILE_SIZE'
                    ? 'Ein oder mehrere Fotos sind zu groß. Maximale Dateigröße ist 25 MB pro Foto.'
                    : (err.message || 'Fehler beim Hochladen der Fotos.')
            });
        }
        next();
    });
};
