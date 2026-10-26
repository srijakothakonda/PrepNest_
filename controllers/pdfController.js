
const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// Get all PDFs for the logged-in user

exports.list = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT *,
                    original_file_name AS original_name,
                    stored_file_name AS stored_name
             FROM pdfs
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [req.session.user.id]
        );

        res.json(rows);
    } catch (err) {
        console.error('PDF list failed:', err.message);
        res.status(500).json({
            message: 'Could not load PDFs.'
        });
    }
};


// Upload a PDF


exports.upload = async (req, res) => {
    let filePath;

    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'Please choose a PDF.'
            });
        }

        filePath = path.join(__dirname, '../uploads', req.file.filename);

        const {
            title,
            description = '',
            category = 'Others',
            total_pages
        } = req.body;

        const pages =
            total_pages === '' || total_pages === undefined
                ? 0
                : Number(total_pages);

        if (!Number.isInteger(pages) || pages < 0) {
            return res.status(400).json({
                message: 'Total pages must be a whole number.'
            });
        }

        const originalName = req.file.originalname;
        const storedName = req.file.filename;
        const pdfTitle = title || path.parse(originalName).name;

        const [result] = await db.query(
            `INSERT INTO pdfs (
                user_id,
                title,
                description,
                category,
                original_file_name,
                stored_file_name,
                file_size,
                total_pages
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.session.user.id,
                pdfTitle,
                description,
                category,
                originalName,
                storedName,
                req.file.size,
                pages
            ]
        );

        return res.status(201).json({
            id: result.insertId,
            message: 'PDF uploaded.'
        });

    } catch (err) {
        console.error('PDF upload failed:', err.message);

        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (fileErr) {
                console.error(fileErr.message);
            }
        }

        return res.status(500).json({
            message: 'Could not upload PDF. Please try again.'
        });
    }
};


// Update reading progress or favorite status
exports.update = async (req, res) => {
    try {
        const { current_page, pages_read, favorite } = req.body;

        const [result] = await db.query(
            `UPDATE pdfs
             SET current_page = COALESCE(?, current_page),
                 pages_read = COALESCE(?, pages_read),
                 favorite = COALESCE(?, favorite)
             WHERE id = ? AND user_id = ?`,
            [
                current_page ?? null,
                pages_read ?? null,
                favorite ?? null,
                req.params.id,
                req.session.user.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'PDF not found.'
            });
        }

        return res.json({
            message: 'Progress saved.'
        });

    } catch (err) {
        console.error('PDF progress update failed:', err.message);

        return res.status(500).json({
            message: 'Could not save progress.'
        });
    }
};

// Delete a PDF
exports.remove = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT stored_file_name FROM pdfs WHERE id = ? AND user_id = ?'
            [req.params.id, req.session.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'PDF not found.'
            });
        }

        const fileName = rows[0].stored_file_name

        if (fileName) {
            const filePath = path.join(
                __dirname,
                '../uploads',
                fileName
            );

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await db.query(
            'DELETE FROM pdfs WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.user.id]
        );

        return res.json({
            message: 'PDF deleted.'
        });

    } catch (err) {
        console.error('PDF deletion failed:', err.message);

        return res.status(500).json({
            message: 'Could not delete PDF.'
        });
    }
};
