const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const c = require('../controllers/pdfController');
const { requireAuth } = require('../middleware/auth');

// Keep the uploaded file in memory (Vercel's disk is read-only).
// Vercel allows request bodies of about 4.5 MB, so the limit is 4 MB.
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'pdf'));
        }
        cb(null, true);
    },
    limits: { fileSize: 4 * 1024 * 1024 }
});

router.get('/pdf', requireAuth, c.list);

router.get('/pdf/file/:id', requireAuth, c.file);

router.post(
    '/pdf/upload',
    requireAuth,
    (req, res, next) => {
        upload.single('pdf')(req, res, (err) => {
            if (!err) return next();

            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    message: 'PDF must be 4 MB or smaller.'
                });
            }

            console.error('Upload error:', err.message);
            return res.status(400).json({
                message: 'Please select a PDF file.'
            });
        });
    },
    c.upload
);

router.put('/pdf/progress/:id', requireAuth, c.update);

router.delete('/pdf/:id', requireAuth, c.remove);

module.exports = router;